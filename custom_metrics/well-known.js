//[well-known]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
//
// 1. Refer for instructions for adding a custom metric in almanamc.js.
// 2. This file has a special case where a custom metric uses 'fetch' and in that case we need to return a promise that resolves to JSON
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

function fetchWithTimeout(url) {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

function parseResponse(url, parser) {
  return fetchWithTimeout(url).then(request => {
    let result = {'path': url};
    if(!request.redirected && request.status === 200) {
      result['found'] = true;
      if(parser) {
        let promise = parser(request);
        if (promise) {
          return promise.then(data => {
            result["data"] = data;
            return result;
          });
        } else {
          result["error"] = "parser did not return a promise";
          return result;
        }
      } else {
        return result;
      }
    } else {
      result['found'] = false;
      return result;
    }
  });
}

return Promise.all([
  // ecommerce
  parseResponse('/.well-known/assetlinks.json'),
  parseResponse('/.well-known/apple-app-site-association'),
  // security
  parseResponse('/robots.txt', r => {

  }),
  parseResponse('/.well-known/security.txt', r => {

  })
]).then((all_data) => {
  return JSON.stringify(all_data);
}).catch(error => {
  return JSON.stringify({message: error.message, error: error});
});
