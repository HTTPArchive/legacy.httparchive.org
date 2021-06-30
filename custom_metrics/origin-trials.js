//[origin_trials]
/**
 * Origin Trials
 * https://github.com/GoogleChrome/OriginTrials
 *
 * Test site: https://floc-ot-meta.glitch.me/
 * Test site: https://floc-ot-header.glitch.me/
 */

/**
 * https://github.com/GoogleChrome/OriginTrials/blob/gh-pages/check-token.html
 *
 * @function validate
 * @param {string} tokenElem
 * @returns {object} origin_trial_metadata
 */
function validate(tokenElem) {
  let validityElem,
    versionElem,
    originElem,
    subdomainElem,
    thirdpartyElem,
    usageElem,
    featureElem,
    expiryElem,
    origin_trial_metadata = {};

  const utf8Decoder = new TextDecoder('utf-8', {fatal: true});

  // Base64-decode the token into a Uint8Array.
  let tokenStr;
  try {
    tokenStr = atob(tokenElem);
  } catch (e) {
    console.error(e);
    origin_trial_metadata.validityElem = 'Invalid Base64';
    return origin_trial_metadata;
  }
  const token = new Uint8Array(tokenStr.length);
  for (let i = 0; i < token.length; i++) {
    token[i] = tokenStr.charCodeAt(i);
  }

  // Check that the version number is 2 or 3.
  const version = token[0];
  versionElem = '' + version;
  if (version !== 2 && version !== 3) {
    origin_trial_metadata.validityElem = 'Unknown version';
    return origin_trial_metadata;
  }

  // Pull the fields out of the token.
  if (token.length < 69) {
    validityElem = 'Token is too short';
    return;
  }
  const payloadLength = new DataView(token.buffer, 65, 4).getInt32(0, /*littleEndian=*/ false);
  const payload = new Uint8Array(token.buffer, 69);
  if (payload.length !== payloadLength) {
    origin_trial_metadata.validityElem = 'Token is ' + payload.length + ' bytes; expected ' + payloadLength;
    return origin_trial_metadata;
  }

  // The version + length + payload is signed.
  const signedData = new Uint8Array(token.buffer.slice(64));
  signedData[0] = token[0];

  // Pull the fields out of the JSON payload.
  let json;
  try {
    json = utf8Decoder.decode(payload);
  } catch (e) {
    origin_trial_metadata.validityElem = 'Invalid UTF-8';
    return origin_trial_metadata;
  }

  let obj;
  try {
    obj = JSON.parse(json);
  } catch (e) {
    origin_trial_metadata.validityElem = 'Invalid JSON';
    return origin_trial_metadata;
  }

  originElem = obj.origin;
  subdomainElem = !!obj.isSubdomain;
  thirdpartyElem = !!obj.isThirdParty;
  usageElem = obj.usage;
  featureElem = obj.feature;
  let expiry;
  try {
    expiry = parseInt(obj.expiry);
  } catch (e) {
    origin_trial_metadata.validityElem = "Expiry value wasn't an integer";
    origin_trial_metadata.expiryElem = obj.expiry;
    return origin_trial_metadata;
  }

  let expiryDate = new Date(expiry * 1000);
  expiryElem = expiryDate.toLocaleString();
  if (expiryDate < new Date()) {
    origin_trial_metadata.validityElem = 'Expired';
    return origin_trial_metadata;
  }

  origin_trial_metadata = {
    validityElem: 'Valid',
    versionElem: versionElem,
    originElem: originElem,
    subdomainElem: subdomainElem,
    thirdpartyElem: thirdpartyElem,
    usageElem: usageElem,
    featureElem: featureElem,
    expiryElem: expiryElem,
  };

  return origin_trial_metadata;
}

/**
 * @function getParameterCaseInsensitive
 * @param {Object} object
 * @param {string} key
 * @returns {any} value
 */
function getParameterCaseInsensitive(object, key) {
  return object[Object.keys(object).find(k => k.toLowerCase() === key.toLowerCase())];
}

let requests = $WPT_REQUESTS;

let meta_tags = Array.from(document.querySelectorAll('meta[http-equiv="origin-trial"]'));

let tokens = meta_tags.map(tag => tag.content);

requests.forEach(request => {
  let header = getParameterCaseInsensitive(request.response_headers, 'origin-trial');
  if (header) {
    tokens = tokens.concat(header.replaceAll(' ', '').split(','));
  }
});

let unique_tokens = Array.from(new Set(tokens));

let origin_trials = unique_tokens.map(token => {
  let origin_trial = validate(token);
  origin_trial.token = token;

  return origin_trial;
});

return origin_trials;
