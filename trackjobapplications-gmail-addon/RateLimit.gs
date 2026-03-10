// --- Rate Limiting ---
// Uses UserProperties to persist sliding-window call timestamps.
// All timestamps are stored as a JSON array of millisecond epoch values.

var RATE_LIMITS = {
  login: { maxCalls: 5,  windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  api:   { maxCalls: 60, windowMs:      60 * 1000  }, // 60 calls per minute
};

/**
 * Returns { allowed: true } or { allowed: false, retryAfterMs: <ms>, retryAfterSec: <s> }.
 * @param {string} key  - 'login' or 'api'
 */
function checkRateLimit(key) {
  var limit = RATE_LIMITS[key];
  if (!limit) return { allowed: true };

  var props = PropertiesService.getUserProperties();
  var storageKey = 'rl_' + key;
  var now = Date.now();

  var raw = props.getProperty(storageKey);
  var timestamps = [];
  try {
    timestamps = raw ? JSON.parse(raw) : [];
  } catch (e) {
    timestamps = [];
  }

  // Slide the window: keep only calls within the last windowMs
  var windowStart = now - limit.windowMs;
  timestamps = timestamps.filter(function(t) { return t > windowStart; });

  if (timestamps.length >= limit.maxCalls) {
    // Oldest timestamp determines when the window resets
    var oldestInWindow = timestamps[0];
    var retryAfterMs = (oldestInWindow + limit.windowMs) - now;
    return {
      allowed: false,
      retryAfterMs: retryAfterMs,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Record this call and persist
  timestamps.push(now);
  props.setProperty(storageKey, JSON.stringify(timestamps));
  return { allowed: true };
}

/**
 * Clears the rate limit counter for a given key.
 * Call after a successful login to reset the login attempt counter.
 * @param {string} key
 */
function resetRateLimit(key) {
  PropertiesService.getUserProperties().deleteProperty('rl_' + key);
}
