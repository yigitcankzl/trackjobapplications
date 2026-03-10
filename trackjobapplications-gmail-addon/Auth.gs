// --- Authentication ---
// Stores JWT tokens in UserProperties (per-user, private)

function getTokens() {
  var props = PropertiesService.getUserProperties();
  return {
    access: props.getProperty('access_token') || '',
    refresh: props.getProperty('refresh_token') || '',
  };
}

function saveTokens(access, refresh) {
  var props = PropertiesService.getUserProperties();
  props.setProperty('access_token', access);
  if (refresh) {
    props.setProperty('refresh_token', refresh);
  }
}

function clearTokens() {
  var props = PropertiesService.getUserProperties();
  props.deleteProperty('access_token');
  props.deleteProperty('refresh_token');
}

function isLoggedIn() {
  return !!getTokens().access;
}

function login(email, password) {
  var rl = checkRateLimit('login');
  if (!rl.allowed) {
    return {
      success: false,
      error: 'Too many login attempts. Try again in ' + rl.retryAfterSec + ' seconds.',
    };
  }

  var url = CONFIG.API_BASE + '/auth/login/';
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ email: email, password: password }),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText());

  if (code === 200 && body.access) {
    saveTokens(body.access, body.refresh);
    resetRateLimit('login'); // successful login clears the attempt counter
    return { success: true };
  }

  return { success: false, error: body.detail || body.error || 'Login failed' };
}

function logout() {
  clearTokens();
}

function refreshAccessToken() {
  var tokens = getTokens();
  if (!tokens.refresh) return false;

  var url = CONFIG.API_BASE + '/auth/token/refresh/';
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ refresh: tokens.refresh }),
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code === 200) {
    var body = JSON.parse(response.getContentText());
    saveTokens(body.access, null);
    return true;
  }

  clearTokens();
  return false;
}

function apiFetch(endpoint, method, payload) {
  var rl = checkRateLimit('api');
  if (!rl.allowed) {
    return { error: 'Rate limit exceeded. Try again in ' + rl.retryAfterSec + ' seconds.', code: 429 };
  }

  var tokens = getTokens();
  if (!tokens.access) return { error: 'Not logged in', code: 401 };

  var options = {
    method: method || 'get',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + tokens.access },
    muteHttpExceptions: true,
  };
  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  var url = CONFIG.API_BASE + endpoint;
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  // Token expired - try refresh
  if (code === 401) {
    if (refreshAccessToken()) {
      tokens = getTokens();
      options.headers = { 'Authorization': 'Bearer ' + tokens.access };
      response = UrlFetchApp.fetch(url, options);
      code = response.getResponseCode();
    } else {
      return { error: 'Session expired, please login again', code: 401 };
    }
  }

  var body = JSON.parse(response.getContentText());
  return { data: body, code: code };
}
