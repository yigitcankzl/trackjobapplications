// Default API URL — override via extension options or chrome.storage
const DEFAULT_API_BASE = 'https://trackjobapplications-backend.onrender.com/api/v1';

const ALLOWED_API_BASES = new Set([
  'http://localhost:8000/api/v1',
  'https://trackjobapplications-backend.onrender.com/api/v1',
]);

// --- Payload Validation ---

const VALID_STATUSES = new Set(['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']);
const VALID_SOURCES  = new Set(['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'email', 'referral', 'company_site', 'other']);
const DATE_RE        = /^\d{4}-\d{2}-\d{2}$/;

const MAX_TEXT_LENGTH          = 200;
const MAX_NOTES_LENGTH         = 2000;
const MAX_URL_LENGTH           = 2048;
const MAX_JOB_POSTING_LENGTH   = 50000;

// Cooldown tracking for ADD_APPLICATION to prevent rapid duplicate submissions
const _addCooldowns = new Map(); // company+position → timestamp
const ADD_COOLDOWN_MS = 1500;

function validateText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function validateUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return '';
  let parsed;
  try { parsed = new URL(value); } catch (_) { return ''; }
  if (parsed.protocol !== 'https:') return '';
  return parsed.href;
}

function validateDate(value) {
  if (typeof value === 'string' && DATE_RE.test(value)) return value;
  return new Date().toISOString().split('T')[0];
}

async function getApiBase() {
  const { api_base } = await chrome.storage.local.get('api_base');
  if (api_base && ALLOWED_API_BASES.has(api_base)) {
    return api_base;
  }
  return DEFAULT_API_BASE;
}

// --- Token Encryption (AES-256-GCM via Web Crypto API) ---
// Key is derived from the extension's runtime ID via HKDF — never stored anywhere.
// Protects tokens against offline chrome.storage dumps without the extension context.

let _encKey = null;

async function _getEncryptionKey() {
  if (_encKey) return _encKey;
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey(
    'raw', enc.encode(chrome.runtime.id), { name: 'HKDF' }, false, ['deriveKey'],
  );
  _encKey = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode('tja-token-v1'), info: enc.encode('storage') },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  return _encKey;
}

function _b64(buf)  { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function _unb64(s)  { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }

async function encryptToken(plaintext) {
  if (!plaintext) return '';
  const key = await _getEncryptionKey();
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext),
  );
  return _b64(iv.buffer) + ':' + _b64(ct);
}

async function decryptToken(stored) {
  if (!stored) return '';
  const sep = stored.indexOf(':');
  if (sep === -1) {
    // Legacy plaintext token — reject and force re-authentication
    console.warn('[TJA] Legacy plaintext token detected, clearing to force re-auth');
    return '';
  }
  try {
    const key   = await _getEncryptionKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: _unb64(stored.slice(0, sep)) },
      key,
      _unb64(stored.slice(sep + 1)),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return ''; // tampered or wrong context — treat as missing
  }
}

// --- Token Storage ---

async function getTokens() {
  const result = await chrome.storage.local.get(['access_token', 'refresh_token']);
  return {
    access:  await decryptToken(result.access_token  || ''),
    refresh: await decryptToken(result.refresh_token || ''),
  };
}

async function saveTokens(access, refresh) {
  const toStore = {};
  if (access)  toStore.access_token  = await encryptToken(access);
  if (refresh) toStore.refresh_token = await encryptToken(refresh);
  if (Object.keys(toStore).length > 0) await chrome.storage.local.set(toStore);
}

async function clearTokens() {
  await chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email']);
}

// --- Authenticated Fetch with Auto-Refresh and Timeout ---

const API_TIMEOUT_MS = 10000;

function _fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal, credentials: 'omit' })
    .finally(() => clearTimeout(id));
}

async function apiFetch(path, options = {}) {
  const apiBase = await getApiBase();
  let { access, refresh } = await getTokens();
  if (!access) throw new Error('Not authenticated');

  let response = await _fetchWithTimeout(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access}`,
      ...options.headers,
    },
  });

  if (response.status === 401 && refresh) {
    const refreshRes = await _fetchWithTimeout(`${apiBase}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Extension-Auth': '1' },
      body: JSON.stringify({ refresh }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      await saveTokens(data.access, data.refresh ?? refresh);
      response = await _fetchWithTimeout(`${apiBase}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.access}`,
          ...options.headers,
        },
      });
    } else {
      await clearTokens();
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

// --- Frontend URL for web login ---

const FRONTEND_URLS = {
  'http://localhost:8000/api/v1': 'http://localhost:3003',
  'https://trackjobapplications-backend.onrender.com/api/v1': 'https://trackjobapplications-eight.vercel.app',
};

async function getFrontendUrl() {
  const apiBase = await getApiBase();
  return FRONTEND_URLS[apiBase] || 'https://trackjobapplications-eight.vercel.app';
}

// --- Message Handler ---

chrome.runtime.onMessage.addListener((message, sender) => {
  // Only accept messages from this extension's own content scripts or popup
  if (sender.id !== chrome.runtime.id) {
    return Promise.resolve({ success: false, error: 'Unauthorized sender' });
  }
  return handleMessage(message);
});

async function handleMessage(message) {
  try {
    switch (message.type) {
      case 'WEB_LOGIN': {
        const frontendUrl = await getFrontendUrl();
        const loginUrl = `${frontendUrl}/login?next=/extension-auth`;
        const tab = await chrome.tabs.create({ url: loginUrl });
        const tabId = tab.id;

        // Watch for the tab to navigate to /extension-auth with hash containing tokens
        return new Promise((resolve) => {
          const TIMEOUT_MS = 300000; // 5 minutes
          let timeoutId = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve({ success: false, error: 'Login timed out' });
          }, TIMEOUT_MS);

          function listener(updatedTabId, changeInfo, updatedTab) {
            if (updatedTabId !== tabId) return;
            const url = changeInfo.url || updatedTab.url || '';
            if (!url.includes('/extension-auth#')) return;

            // Extract tokens from hash
            try {
              const hash = url.split('#')[1];
              if (!hash) return;
              const params = new URLSearchParams(hash);
              const access = params.get('access');
              const refresh = params.get('refresh');
              const email = params.get('email');
              if (!access || !refresh) return;

              clearTimeout(timeoutId);
              chrome.tabs.onUpdated.removeListener(listener);

              // Save tokens and close tab
              (async () => {
                await saveTokens(access, refresh);
                if (email) await chrome.storage.local.set({ user_email: email });
                try { await chrome.tabs.remove(tabId); } catch {}
                resolve({ success: true });
              })();
            } catch {
              // Ignore parse errors, keep listening
            }
          }

          chrome.tabs.onUpdated.addListener(listener);

          // If tab is closed before login completes
          function onRemoved(removedTabId) {
            if (removedTabId !== tabId) return;
            clearTimeout(timeoutId);
            chrome.tabs.onUpdated.removeListener(listener);
            chrome.tabs.onRemoved.removeListener(onRemoved);
            resolve({ success: false, error: 'Login tab was closed' });
          }
          chrome.tabs.onRemoved.addListener(onRemoved);
        });
      }

      case 'LOGIN': {
        const apiBase = await getApiBase();
        const res = await _fetchWithTimeout(`${apiBase}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Extension-Auth': '1' },
          body: JSON.stringify({ email: message.email, password: message.password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const detail = err.detail || err.non_field_errors?.[0] || Object.values(err).flat().join(', ') || 'Login failed';
          return { success: false, error: typeof detail === 'string' ? detail : JSON.stringify(detail) };
        }
        const data = await res.json();
        await saveTokens(data.access, data.refresh);
        const meRes = await apiFetch('/auth/me/');
        if (meRes.ok) {
          const user = await meRes.json();
          await chrome.storage.local.set({ user_email: user.email });
        }
        return { success: true };
      }

      case 'LOGOUT': {
        const { access, refresh } = await getTokens();
        if (refresh) {
          const apiBase = await getApiBase();
          await _fetchWithTimeout(`${apiBase}/auth/logout/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(access ? { 'Authorization': `Bearer ${access}` } : {}),
            },
            body: JSON.stringify({ refresh }),
          }).catch(() => {}); // Ignore errors — clear local tokens regardless
        }
        await clearTokens();
        return { success: true };
      }

      case 'CHECK_AUTH': {
        const { access } = await getTokens();
        const stored = await chrome.storage.local.get('user_email');
        return { authenticated: !!access, email: stored.user_email || '' };
      }

      case 'ADD_APPLICATION': {
        const company  = validateText(message.company, MAX_TEXT_LENGTH);
        const position = validateText(message.position, MAX_TEXT_LENGTH);
        if (!company || !position) {
          return { success: false, error: 'Invalid company or position' };
        }
        const cooldownKey = `${company}|${position}`;
        const lastAdd = _addCooldowns.get(cooldownKey) || 0;
        if (Date.now() - lastAdd < ADD_COOLDOWN_MS) {
          return { success: false, error: 'Please wait before adding the same job again' };
        }
        _addCooldowns.set(cooldownKey, Date.now());
        const payload = {
          company,
          position,
          url:          validateUrl(message.url),
          source:       VALID_SOURCES.has(message.source) ? message.source : 'other',
          applied_date: validateDate(message.applied_date),
          status:       VALID_STATUSES.has(message.status) ? message.status : 'to_apply',
        };
        const notes = validateText(message.notes, MAX_NOTES_LENGTH);
        if (notes) payload.notes = notes;
        const jobPostingContent = validateText(message.job_posting_content, MAX_JOB_POSTING_LENGTH);
        if (jobPostingContent) payload.job_posting_content = jobPostingContent;
        if (Array.isArray(message.tag_ids) && message.tag_ids.length > 0) {
          payload.tag_ids = message.tag_ids.filter(id => typeof id === 'number' && id > 0);
        }
        const res = await apiFetch('/applications/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errorMsg =
            err.non_field_errors?.[0] ||
            err.detail ||
            Object.values(err).flat().join(', ') ||
            'Failed to add application';
          return { success: false, error: errorMsg };
        }
        const data = await res.json();
        return { success: true, data };
      }

      case 'ADD_CONTACT': {
        const appId = message.application_id;
        if (!appId || typeof appId !== 'number') {
          return { success: false, error: 'Invalid application ID' };
        }
        const name = validateText(message.name, 100);
        if (!name) return { success: false, error: 'Contact name is required' };
        const payload = { name };
        const email = validateText(message.email, 254);
        if (email) payload.email = email;
        const res = await apiFetch(`/applications/${appId}/contacts/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.detail || 'Failed to add contact' };
        }
        return { success: true, data: await res.json() };
      }

      case 'ADD_INTERVIEW': {
        const appId = message.application_id;
        if (!appId || typeof appId !== 'number') {
          return { success: false, error: 'Invalid application ID' };
        }
        const validTypes = new Set([
          'phone_screen', 'technical', 'behavioral', 'onsite', 'take_home', 'final', 'other',
        ]);
        const stageType = validTypes.has(message.stage_type) ? message.stage_type : 'other';
        if (!message.scheduled_at) {
          return { success: false, error: 'Interview date is required' };
        }
        const payload = { stage_type: stageType, scheduled_at: message.scheduled_at };
        const res = await apiFetch(`/applications/${appId}/interviews/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.detail || err.scheduled_at?.[0] || 'Failed to add interview' };
        }
        return { success: true, data: await res.json() };
      }

      case 'TOGGLE_PIN': {
        const appId = message.application_id;
        if (!appId || typeof appId !== 'number') {
          return { success: false, error: 'Invalid application ID' };
        }
        const res = await apiFetch(`/applications/${appId}/toggle-pin/`, {
          method: 'POST',
        });
        if (!res.ok) return { success: false, error: 'Failed to toggle pin' };
        return { success: true, data: await res.json() };
      }

      case 'ADD_OFFER': {
        const appId = message.application_id;
        if (!appId || typeof appId !== 'number') {
          return { success: false, error: 'Invalid application ID' };
        }
        const payload = {};
        if (message.salary) payload.salary = String(message.salary);
        if (message.currency) payload.currency = message.currency;
        if (message.salary_period) payload.salary_period = message.salary_period;
        if (message.benefits) payload.benefits = validateText(message.benefits, MAX_NOTES_LENGTH);
        const res = await apiFetch(`/applications/${appId}/offer/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.detail || err.salary?.[0] || 'Failed to add offer' };
        }
        return { success: true, data: await res.json() };
      }

      case 'GET_TAGS': {
        const res = await apiFetch('/applications/tags/');
        if (!res.ok) return { success: false, error: 'Failed to load tags' };
        return { success: true, data: await res.json() };
      }

      case 'GET_STATS': {
        const res = await apiFetch('/applications/stats/');
        if (!res.ok) return { success: false, error: 'Failed to load stats' };
        return { success: true, data: await res.json() };
      }

      case 'GET_RECENT': {
        const res = await apiFetch('/applications/brief/');
        if (!res.ok) return { success: false, error: 'Failed to load applications' };
        const all = await res.json();
        return { success: true, data: all.slice(0, 5) };
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
}
