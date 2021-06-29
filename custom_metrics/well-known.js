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
    let resultObj = {};
    if(!request.redirected && request.status === 200) {
      resultObj['found'] = true;
      if(parser) {
        let promise = parser(request);
        if (promise) {
          return promise.then(data => {
            resultObj['data'] = data;
            return [url, resultObj];
          });
        } else {
          resultObj['error'] = 'parser did not return a promise';
          return [url, resultObj];
        }
      } else {
        return [url, resultObj];
      }
    } else {
      resultObj['found'] = false;
      return [url, resultObj];
    }
  });
}

return Promise.all([
  // ecommerce
  parseResponse('/.well-known/assetlinks.json'),
  parseResponse('/.well-known/apple-app-site-association'),
  // privacy
  parseResponse('/.well-known/gpc.json', r => {
    return r.text().then(text => {
      let data = {
        'gpc': null
      };
      let gpc_data = JSON.parse(text);
      if (typeof gpc_data.gpc == 'boolean') {
        data.gpc = gpc_data.gpc;
      }
      return data;
    });
  }),
  // security
  parseResponse('/robots.txt', r => {
    return r.text().then(text => {
      let data = {'user-agents': [], 'disallows': []};
      for(let line of text.split('\n')) {
        if (line.startsWith('User-agent: ')) {
          data['user-agents'].push(line.substring(12));
        } else if (line.startsWith('Disallow: ')) {
          data['disallows'].push(line.substring(10));
        }
      }
      return data;
    });
  }),
  parseResponse('/.well-known/security.txt', r => {
    return r.text().then(text => {
      let data = {
        'signed': false
      };
      if (text.startsWith("-----BEGIN PGP SIGNED MESSAGE-----")) {
        data['signed'] = true;
      }
      for(let line of text.split('\n')) {
        if (line.startsWith('Canonical: ')) {
          data['canonical'] = line.substring(11);
        } else if (line.startsWith('Encryption: ')) {
          data['encryption'] = line.substring(12);
        } else if (line.startsWith('Expires: ')) {
          data['expires'] = line.substring(9);
        } else if (line.startsWith('Policy: ')) {
          data['policy'] = line.substring(8);
        }
      }
      return data;
    });
  })
]).then((all_data) => {
  return JSON.stringify(Object.fromEntries(all_data));
}).catch(error => {
  return JSON.stringify({message: error.message, error: error});
});
