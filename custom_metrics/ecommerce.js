//[ecommerce]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
//
// 1. Refer for instructions for addding a custom metric in almanamc.js.
// 2. This file has a special case where a custom metric uses 'fetch' and in that case we need to return a promise that resolves to JSON 
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

function fetchWithTimeout(url) {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

return Promise.all([
  fetchWithTimeout('/.well-known/assetlinks.json').then(function(r) {
    if(!r.redirected && r.status === 200) {
     return 1;
    } else {
     return 0;
    }
  }),
  fetchWithTimeout('/.well-known/apple-app-site-association').then(function(r) {
    if(!r.redirected && r.status === 200) {
      return 1;
    } else {
      return 0;
    }
  })
]).then(([AndroidAppLinks, iOSUniveralLinks]) => {
  return JSON.stringify({AndroidAppLinks, iOSUniveralLinks});
}).catch(error => {
  return JSON.stringify({message: error.message, error: error});
});