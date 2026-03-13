// Shorthand for chrome.i18n.getMessage
function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

// Auto-translate all elements with data-i18n attributes
// data-i18n="key" → sets textContent
// data-i18n-placeholder="key" → sets placeholder
// data-i18n-title="key" → sets title
function applyI18n(root) {
  const container = root || document;

  container.querySelectorAll('[data-i18n]').forEach(el => {
    const msg = t(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });

  container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const msg = t(el.dataset.i18nPlaceholder);
    if (msg) el.placeholder = msg;
  });

  container.querySelectorAll('[data-i18n-title]').forEach(el => {
    const msg = t(el.dataset.i18nTitle);
    if (msg) el.title = msg;
  });
}

// Run on DOMContentLoaded if in a page context
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyI18n());
  } else {
    applyI18n();
  }
}
