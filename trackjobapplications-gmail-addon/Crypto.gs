// --- Token Encryption for Apps Script ---
// Apps Script has no native AES API, so we use HMAC-SHA256 as a CTR-mode PRF.
//
// Security model:
//   Master key = HMAC-SHA256(message = per-user-random-salt, key = ScriptApp.getScriptId())
//   The salt is generated once and stored in UserProperties; the script ID is never stored.
//   Decryption requires both the salt AND the script ID, so a raw storage dump is insufficient.
//
// Stored format: "1:<base64(nonce)>:<base64(ciphertext)>"

var CIPHER_VERSION = '1';

/**
 * Returns the 32-byte master key (signed byte array).
 * Key = HMAC-SHA256(salt, scriptId). Salt is persisted; scriptId is not.
 */
function _getMasterKey_() {
  var props = PropertiesService.getUserProperties();
  var salt  = props.getProperty('crypto_salt');

  if (!salt) {
    var saltBytes = [];
    for (var i = 0; i < 32; i++) {
      saltBytes.push(Math.floor(Math.random() * 256));
    }
    salt = Utilities.base64Encode(saltBytes);
    props.setProperty('crypto_salt', salt);
  }

  return Utilities.computeHmacSha256Signature(salt, ScriptApp.getScriptId());
}

/**
 * Produces `length` bytes of key stream via HMAC counter mode.
 * stream[i*32 .. (i+1)*32] = HMAC-SHA256(base64(nonce || [counter]), base64(masterKey))
 */
function _keyStream_(masterKey, nonce, length) {
  var stream = [];
  var counter = 0;
  var keyB64 = Utilities.base64Encode(masterKey);

  while (stream.length < length) {
    var block = nonce.concat([counter & 0xFF]);
    stream = stream.concat(
      Utilities.computeHmacSha256Signature(Utilities.base64Encode(block), keyB64)
    );
    counter++;
  }

  return stream;
}

/**
 * Encrypts a plaintext token string.
 * Returns "1:<base64(nonce)>:<base64(ciphertext)>", or plaintext on failure
 * (to avoid losing a valid token if encryption itself fails).
 * @param {string} plaintext
 * @returns {string}
 */
function encryptToken(plaintext) {
  if (!plaintext) return '';
  try {
    var masterKey = _getMasterKey_();

    var nonce = [];
    for (var i = 0; i < 16; i++) {
      nonce.push(Math.floor(Math.random() * 256));
    }

    var plainBytes = Utilities.newBlob(plaintext).getBytes();
    var stream     = _keyStream_(masterKey, nonce, plainBytes.length);
    var cipher     = plainBytes.map(function(b, i) {
      return (b & 0xFF) ^ (stream[i] & 0xFF);
    });

    return CIPHER_VERSION + ':'
      + Utilities.base64Encode(nonce) + ':'
      + Utilities.base64Encode(cipher);
  } catch (e) {
    Logger.log('encryptToken failed: ' + e);
    return plaintext; // fail-open to avoid losing the token
  }
}

/**
 * Decrypts a value produced by encryptToken().
 * Legacy plaintext values (no "1:..." prefix) are returned as-is and will be
 * re-encrypted on the next saveTokens() call.
 * Returns '' if decryption fails (tampered data or wrong script context).
 * @param {string} stored
 * @returns {string}
 */
function decryptToken(stored) {
  if (!stored) return '';

  var parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== CIPHER_VERSION) {
    return stored; // legacy plaintext — pass through
  }

  try {
    var masterKey = _getMasterKey_();
    var nonce     = Utilities.base64Decode(parts[1]);
    var cipher    = Utilities.base64Decode(parts[2]);
    var stream    = _keyStream_(masterKey, nonce, cipher.length);
    var plain     = cipher.map(function(b, i) {
      return (b & 0xFF) ^ (stream[i] & 0xFF);
    });
    return Utilities.newBlob(plain).getDataAsString();
  } catch (e) {
    Logger.log('decryptToken failed: ' + e);
    return ''; // treat as invalid/missing token
  }
}
