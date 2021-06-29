//[javascript]
// Uncomment the previous line for testing on webpagetest.org

// Please, refer to instructions for adding a custom metric in almanac.js.

const requests = $WPT_REQUESTS;

return JSON.stringify({
    ajax_requests: (() => {
        // Returns the number of ajax requests per page.
        var ajax_apis = ['xmlhttprequest', 'fetch', 'beacon'];
        return window.performance.getEntriesByType('resource').filter(r => ajax_apis.includes(r.initiatorType)).reduce((obj, r) => {
            obj.total++;
            obj[r.initiatorType]++;
            return obj;
        }, Object.fromEntries([...ajax_apis, 'total'].map(api => [api, 0])))
    })(),

    // Returns the number of ajax requests using beacon.
    beacon_ajax_usage: window.performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'beacon').length,

    // Returns the number of iframes per page.
    iframe: document.getElementsByTagName('iframe').length,

    requests_protocol: (() => {
        // Returns the percentage of http 2 protocol used.
        try {
            var ajaxs = window.performance.getEntriesByType('resource').filter((r) => ['xmlhttprequest', 'fetch', 'beacon'].includes(r.initiatorType));
            var resources = window.performance.getEntriesByType('resource').filter((r) => r.initiatorType !== 'xmlhttprequest' && r.initiatorType !== 'fetch' && r.initiatorType !== 'beacon');
            let request_data = {
                ajax_h1: ajaxs.filter(r => ['http/1.1', 'http/1'].includes(r.nextHopProtocol)).length,
                resources_h1: resources.filter(r => ['http/1.1', 'http/1'].includes(r.nextHopProtocol)).length,
                ajax_h2: ajaxs.filter(r => ['h2', 'http/2', 'http2'].includes(r.nextHopProtocol)).length,
                resources_h2: resources.filter(r => ['h2', 'http/2', 'http2'].includes(r.nextHopProtocol)).length,
                ajax_h3: ajaxs.filter(r => ["h3", "http/3", "h3-29"].includes(r.nextHopProtocol)).length,
                resources_h3: resources.filter(r => ["h3", "http/3", "h3-29"].includes(r.nextHopProtocol)).length,
            }
            return request_data;
        } catch (e) {
            return null;
        }
    })(),

    webcomponents_shadowDOM: (() => {
        // Returns the number of web components or shadow roots on a web page.
        try {
            var elements_with_hyphen = Array.from(document.getElementsByTagName("*")).filter(e => e.nodeName.includes('-'));
            var shadow_roots = elements_with_hyphen.filter(e => e.shadowRoot)
            var web_components = elements_with_hyphen.filter(e => customElements.get(e.nodeName.toLowerCase()));
            let element_data = {
                total_potential_web_components: elements_with_hyphen,
                web_components: web_components,
                shadow_roots: shadow_roots
            }
            return element_data;
        } catch (e) {
            return null;
        }
    })(),
    // Returns the content-types of requests.
    content_types: requests.map((req) => req.response_headers['content-type']),

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
            type_module: script_tags.filter(tag => tag.type == 'module').length,
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
