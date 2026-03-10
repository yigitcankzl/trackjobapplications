// --- Shared DOM Sanitization Utilities ---
// Injected before linkedin.js and indeed.js via manifest.json content_scripts.

/**
 * Strips ASCII control characters, trims whitespace, and enforces a max length.
 * @param {unknown} value
 * @param {number} maxLength
 * @returns {string}
 */
function sanitizeText(value, maxLength = 200) {
  if (typeof value !== 'string') return '';
  return value
    // Remove C0/C1 control characters (null, BEL, BS, VT, FF, SO–US, DEL)
    // but keep 0x09 (tab), 0x0A (LF), 0x0D (CR) so trim() handles them
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and normalises a URL extracted from the DOM.
 * Rules:
 *  - Must be a parseable URL
 *  - Protocol must be https:
 *  - Hostname must match one of allowedHostnames (exact or subdomain)
 *  - Final href must not exceed 2048 characters
 * Returns '' on any failure.
 * @param {unknown} value
 * @param {string[]} allowedHostnames  e.g. ['linkedin.com', 'indeed.com']
 * @returns {string}
 */
function sanitizeUrl(value, allowedHostnames) {
  if (typeof value !== 'string' || value.length > 2048) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch (_) {
    return '';
  }
  if (parsed.protocol !== 'https:') return '';
  if (allowedHostnames && allowedHostnames.length > 0) {
    const host = parsed.hostname.toLowerCase();
    const allowed = allowedHostnames.some(
      h => host === h || host.endsWith('.' + h)
    );
    if (!allowed) return '';
  }
  if (parsed.href.length > 2048) return '';
  return parsed.href;
}
