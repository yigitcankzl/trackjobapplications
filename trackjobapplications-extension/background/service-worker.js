const API_BASE = 'http://localhost:8000/api';

// --- Token Storage ---

async function getTokens() {
  const result = await chrome.storage.local.get(['access_token', 'refresh_token']);
  return { access: result.access_token, refresh: result.refresh_token };
}

async function saveTokens(access, refresh) {
  await chrome.storage.local.set({ access_token: access, refresh_token: refresh });
}

async function clearTokens() {
  await chrome.storage.local.remove(['access_token', 'refresh_token', 'user_email']);
}

// --- Authenticated Fetch with Auto-Refresh ---

async function apiFetch(path, options = {}) {
  let { access, refresh } = await getTokens();
  if (!access) throw new Error('Not authenticated');

  let response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access}`,
      ...options.headers,
    },
  });

  if (response.status === 401 && refresh) {
    const refreshRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      await saveTokens(data.access, data.refresh ?? refresh);
      response = await fetch(`${API_BASE}${path}`, {
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

// --- Message Handler ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // keep channel open for async response
});

async function handleMessage(message) {
  try {
    switch (message.type) {
      case 'LOGIN': {
        const res = await fetch(`${API_BASE}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: message.email, password: message.password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err.detail || 'Login failed' };
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
        await clearTokens();
        return { success: true };
      }

      case 'CHECK_AUTH': {
        const { access } = await getTokens();
        const stored = await chrome.storage.local.get('user_email');
        return { authenticated: !!access, email: stored.user_email || '' };
      }

      case 'ADD_APPLICATION': {
        const payload = {
          company: message.company,
          position: message.position,
          url: message.url,
          source: message.source,
          applied_date: message.applied_date,
          status: message.status || 'to_apply',
        };
        if (message.notes) payload.notes = message.notes;
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

      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (e) {
    return { success: false, error: e.message || 'Network error' };
  }
}
