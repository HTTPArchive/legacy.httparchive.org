//[javascript]
// Uncomment the previous line for testing on webpagetest.org

// Please, refer to instructions for adding a custom metric in almanac.js.

const requests = $WPT_REQUESTS;

return JSON.stringify({
  'num-ajax-requests': (() => {
    // Returns the number of ajax requests per page.
    var ajax_apis = ['xmlhttprequest', 'fetch', 'beacon'];
    return window.performance.getEntriesByType('resource').filter((r) => ajax_apis.includes(r.initiatorType)).length;
  })(),

  // Returns the number of ajax requests using beacon.
  beacon_ajax_usage: window.performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'beacon').length,

  // Returns the number of iframes per page.
  iframe: document.getElementsByTagName('iframe').length,

  requests_protocol: (() => {
    // Returns the percentage of http 2 protocol used.
    try {
      if (requests.length > 0) {
        var ajaxs = window.performance.getEntriesByType('resource').filter((r) => ['xmlhttprequest', 'fetch', 'beacon'].includes(r.initiatorType));
        var resources = window.performance.getEntriesByType('resource').filter((r) => r.initiatorType !== 'xmlhttprequest' && r.initiatorType !== 'fetch' && r.initiatorType !== 'beacon');
        return JSON.stringify({
          total_requests: requests.length,
          total_h1: requests.filter((r) => ['http/1.1', 'http/1'].includes(r.protocol)).length,
          ajax_h1: ajaxs.filter((r) => ['http/1.1', 'http/1'].includes(r.nextHopProtocol)).length,
          resources_h1: resources.filter((r) => ['http/1.1', 'http/1'].includes(r.nextHopProtocol)).length,
          total_h2: requests.filter((r) => ['h2', 'http/2', 'http2'].includes(r.protocol)).length,
          ajax_h2: ajaxs.filter((r) => ['h2', 'http/2', 'http2'].includes(r.nextHopProtocol)).length,
          resources_h2: resources.filter((r) => ['h2', 'http/2', 'http2'].includes(r.nextHopProtocol)).length,
          total_h3: requests.filter((r) => r.protocol === 'http/3').length,
          ajax_h3: ajaxs.filter((e) => r.nextHopProtocol === 'http/3').length,
          resources_h3: resources.filter((e) => r.nextHopProtocol === 'http/3').length,
        });
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  })(),

  num_webcomp_shadow: (() => {
    // Returns the number of web components or shadow roots on a web page.
    try {
      var elements_with_hyphen = Array.from(document.body.getElementsByTagName('*')).filter((e) => e.nodeName.includes('-'));
      return JSON.stringify({
        total_potential_web_components: elements_with_hyphen.length,
        custom_elements: elements_with_hyphen.filter((e) => customElements.get(e.nodeName.toLowerCase())).length,
        shadow_roots: elements_with_hyphen.filter((e) => e.shadowRoot).length,
      });
    } catch (e) {
      return null;
    }
  })(),

  content_types: (() => {
    // Returns the content-types of requests.
    try {
      if (requests.length > 0) {
        return requests.map((req) => req.response_headers['content-type']);
      } else {
        return requests.length;
      }
    } catch (e) {
      return null;
    }
  })(),

  memory_usage: (() => {
    /*  Returns the memory usage of a page - JS and dom elements only
            Important - webpagetest needs flags to be test:
            --disable-web-security, --no-site-isolation */
    try {
      return new Promise((resolve) => {
        performance.measureUserAgentSpecificMemory().then((value) => {
          resolve(JSON.stringify(value));
        });
      });
    } catch (e) {
      return null;
    }
  })(),

  script_tags: (() => {
    let script_tags = Array.from(document.querySelectorAll('script'));

    let script_data = {
        total: script_tags.length,
        async: script_tags.filter(tag => tag.async).length,
        defer: script_tags.filter(tag => tag.defer).length,
        crossorigin: script_tags.filter(tag => tag.crossorigin).length,
        integrity: script_tags.filter(tag => tag.integrity).length,
        nomodule: script_tags.filter(tag => tag.nomodule).length,
        nonce: script_tags.filter(tag => tag.nonce).length,
        referrerpolicy: script_tags.filter(tag => tag.referrerpolicy).length,
        src: script_tags.filter(tag => tag.src).length,
        type_module: script_tags.filter(tag => tag.type=='module').length,
    };

    return script_data;
  })(),

  noscript_tags: (() => {
    let noscript_data = {
      total: document.querySelectorAll('noscript').length,
    };

    return noscript_data;
  })()

});
