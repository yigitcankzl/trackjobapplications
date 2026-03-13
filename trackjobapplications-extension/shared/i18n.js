// JS-based i18n with runtime language switching
// Loads translations from _locales/<lang>/messages.json
// Falls back to chrome.i18n.getMessage() then to English

const SUPPORTED_LANGS = ['en', 'tr'];
const DEFAULT_LANG = 'en';

let _messages = {};
let _currentLang = DEFAULT_LANG;

// Detect browser language (first 2 chars, e.g. "en-US" → "en")
function detectLang() {
  const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : DEFAULT_LANG;
}

// Load messages for a given language
async function loadMessages(lang) {
  try {
    const url = chrome.runtime.getURL(`_locales/${lang}/messages.json`);
    const res = await fetch(url);
    return await res.json();
  } catch {
    return {};
  }
}

// Initialize i18n: load saved preference or detect from browser
async function initI18n() {
  const stored = await chrome.storage.local.get('lang');
  _currentLang = stored.lang || detectLang();
  _messages = await loadMessages(_currentLang);

  // Load English fallback if not English
  if (_currentLang !== 'en') {
    const enMessages = await loadMessages('en');
    // Merge: current lang overrides English
    _messages = { ...enMessages, ..._messages };
  }

  applyI18n();
}

// Get translated message
function t(key, substitutions) {
  const entry = _messages[key];
  if (!entry) return key;

  let msg = entry.message || key;

  // Handle placeholders like $COUNT$, $TOTAL$
  if (substitutions && entry.placeholders) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    for (const [name, def] of Object.entries(entry.placeholders)) {
      const idx = parseInt(def.content?.replace('$', ''), 10) - 1;
      if (idx >= 0 && idx < subs.length) {
        msg = msg.replace(new RegExp('\\$' + name.toUpperCase() + '\\$', 'g'), subs[idx]);
      }
    }
  }

  return msg;
}

// Get current language
function getCurrentLang() {
  return _currentLang;
}

// Switch language and re-apply
async function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  _currentLang = lang;
  await chrome.storage.local.set({ lang });
  _messages = await loadMessages(lang);
  if (lang !== 'en') {
    const enMessages = await loadMessages('en');
    _messages = { ...enMessages, ..._messages };
  }
  applyI18n();
}

// Apply translations to all data-i18n elements
function applyI18n(root) {
  const container = root || document;

  container.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = t(el.dataset.i18n);
    if (msg && msg !== el.dataset.i18n) el.textContent = msg;
  });

  container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const msg = t(el.dataset.i18nPlaceholder);
    if (msg && msg !== el.dataset.i18nPlaceholder) el.placeholder = msg;
  });

  container.querySelectorAll('[data-i18n-title]').forEach(el => {
    const msg = t(el.dataset.i18nTitle);
    if (msg && msg !== el.dataset.i18nTitle) el.title = msg;
  });
}
