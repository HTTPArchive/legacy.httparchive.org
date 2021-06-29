const requests = $WPT_REQUESTS;

return JSON.stringify({
    'ajax-requests': (() => {
        // Returns the number of ajax requests per page.
        var ajax_apis = ['xmlhttprequest', 'fetch', 'beacon'];
        return window.performance.getEntriesByType('resource').filter(r => ajax_apis.includes(r.initiatorType)).reduce((obj, r) => {
            obj.total++;
            obj[r.initiatorType]++;
            return obj;
        }, Object.fromEntries([...ajax_apis, 'total'].map(api => [api, 0])))
    })(),
    // Returns the number of iframes per page.
    'iframe': document.getElementsByTagName('iframe').length,
    'requests_protocol': (() => {
        // Returns the percentage of http 2 protocol used.
        try {
            var ajaxs = window.performance.getEntriesByType('resource').filter(r => ['xmlhttprequest', 'fetch', 'beacon'].includes(r.initiatorType))
            var resources = window.performance.getEntriesByType('resource').filter(r => r.initiatorType !== 'xmlhttprequest' && r.initiatorType !== 'fetch' && r.initiatorType !== 'beacon')
            return JSON.stringify({
                'total_requests': requests.length,
                'total_h1': requests.filter(r => ["http/1.1", "http/1"].includes(r.protocol)).length,
                'ajax_h1': ajaxs.filter(r => ["http/1.1", "http/1"].includes(r.nextHopProtocol)).length,
                'resources_h1': resources.filter(r => ["http/1.1", "http/1"].includes(r.nextHopProtocol)).length,
                'total_h2': requests.filter(r => ["h2", "http/2", "http2"].includes(r.protocol)).length,
                'ajax_h2': ajaxs.filter(r => ["h2", "http/2", "http2"].includes(r.nextHopProtocol)).length,
                'resources_h2': resources.filter(r => ["h2", "http/2", "http2"].includes(r.nextHopProtocol)).length,
                'total_h3': requests.filter(r => ["h3", "http/3", "h3-29"].includes(r.protocol)).length,
                'ajax_h3': ajaxs.filter(e => ["h3", "http/3", "h3-29"].includes(r.nextHopProtocol)).length,
                'resources_h3': resources.filter(e => ["h3", "http/3", "h3-29"].includes(r.nextHopProtocol)).length,
            });

        } catch (e) {
            return null;
        }
    })(),
    'webcomponent_shadowDOM': (() => {
        // Returns the number of web components or shadow roots on a web page.
        try {
            var elements_with_hyphen = Array.from(document.body.getElementsByTagName("*")).filter(e => e.nodeName.includes('-'));
            var unique_web_components = [...new Set(elements_with_hyphen.map(e => e.nodeName.toLowerCase()))];
            var shadow_roots = elements_with_hyphen.filter(e => e.shadowRoot)
            var web_components = elements_with_hyphen.filter(e => customElements.get(e.nodeName.toLowerCase()));
            return JSON.stringify({
                // TODO - find unique elements
                'total_potential_web_components': { 'elements': elements_with_hyphen, 'length': elements_with_hyphen.length },
                'web_components': { 'elements': web_components, 'length': web_components.length },
                'unique_web_components': { 'elements': unique_web_components, 'length': unique_web_components.length },
                'shadow_roots': { 'elements': shadow_roots, 'length': shadow_roots.length }
            })
        } catch (e) {
            return null;
        }
    })(),
    'content-types': requests.map(req => req.response_headers['content-type']),
    'memory_usage': (() => {
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
});