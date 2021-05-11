//[pwa]
const response_bodies = $WPT_BODIES;
const requests = $WPT_REQUESTS;
const serviceWorkerRegistrationPattern = /navigator\.serviceWorker\.register\(['"]([^"']+)/m;

const serviceWorkerURLs = response_bodies.filter(har => {
  return serviceWorkerRegistrationPattern.test(har.response_body);
}).map(har => {
  const base = new URL(har.url).origin;
  const serviceWorkerPath = har.response_body.match(serviceWorkerRegistrationPattern)[1];
  return new URL(serviceWorkerPath, base).href;
}).reduce((set, url) => {
  set.add(url);
  return set;
}, new Set());


const manifestURLs = new Set(Array.from(document.querySelectorAll('link[rel=manifest]')).map(link => {
  const base = new URL(location.href).origin;
  const href = link.getAttribute('href');
  return new URL(href, base).href;
}));


const initiatorMap = requests.reduce((map, request) => {
  const url = request.url;
  let initiator = request.initiator.url;
  if (!initiator) {
    initiator = request.initiator?.stack?.callFrames?.[0]?.url
  }
  map[initiator] = map[initiator] || [];
  map[initiator].push(url);
  return map;
}, {});

function getURLsInitiatedBy(initialURL) {
  let initiatorChain = [initialURL];
  for (let i = 0; i < initiatorChain.length; i++) {
    const url = initiatorChain[i];
    if (url in initiatorMap) {
      initiatorChain = initiatorChain.concat(initiatorMap[url].filter(url => {
        return !initiatorChain.includes(url);
      }));
    }
  }
  return initiatorChain;
}

function getEntriesForURLs(urlSet) {
  return response_bodies.filter(har => {
    return urlSet.has(har.url);
  }).map(har => {
    return [har.url, har.response_body];
  });
}

const serviceWorkers = getEntriesForURLs(serviceWorkerURLs);
const manifests = getEntriesForURLs(manifestURLs).map(([url, body]) => {
  let manifest;
  try {
    manifest = JSON.parse(body);
  } catch (e) {
    manifest = body;
  }
  return [url, manifest];
});


const serviceWorkerInitiatedURLs = new Set(Array.from(serviceWorkerURLs).flatMap(getURLsInitiatedBy));
const serviceWorkerInitiated = getEntriesForURLs(serviceWorkerInitiatedURLs);

const workboxPattern = /workbox\.([a-zA-Z]+\.?[a-zA-Z]*)/g;
const workboxPackagePattern = /([a-zA-Z]+)\.?[a-zA-Z]*/;
const workboxMethodPattern = /([a-zA-Z]+\.?[a-zA-Z]*)/;
// We should use serviceWorkerInitiatedURLs here, but SW detection has some false negatives.
const workboxInfo = response_bodies.filter(har => {
  return workboxPattern.test(har.response_body);
}).map(har => {
  return [har.url, Array.from(har.response_body.matchAll(workboxPattern)).map(m => m[0])];
});

return {
  serviceWorkers: Object.fromEntries(serviceWorkers),
  manifests: Object.fromEntries(manifests),
  serviceWorkerInitiated: Object.keys(Object.fromEntries(serviceWorkerInitiated)),
  workboxInfo: Object.fromEntries(workboxInfo)
};
