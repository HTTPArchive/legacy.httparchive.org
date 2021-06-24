return JSON.stringify({
    'num-ajax-requests': (() => {
        // Returns the number of ajax requests per page.
        var ajax_apis = ['xmlhttprequest', 'fetch', 'beacon'];
        return window.performance.getEntriesByType('resource').filter(r => ajax_apis.includes(r.initiatorType)).length;

    })(),
    // Returns the number of iframes per page.
    'iframe': document.getElementsByTagName('iframe').length,
    'ajax_protocol': (() => {
        // Returns the percentage of http 2 protocol used.
        try {
            var requests = $WPT_REQUESTS;
            var usage_percent
            if (requests.length > 0) {
                var num_requests = requests.length;
                var http2_count = requests.filter(r => r.protocol === "h2").length;
                usage_percent = (http2_count / num_requests) * 100;
            }
            else {
                usage_percent = null;
            }

            return usage_percent;
        } catch (e) {
            return null;
        }
    })(),
    'content-types': (() => {
        // Returns the content-types of requests.
        try {
            var requests = $WPT_REQUESTS;
            if (requests.length > 0) {
                return requests.map(req => req.request_headers["accept"])
            }
            else {
                return null
            }

        } catch (e) {
            return null;
        }
    })(),
    // Returns the number of ajax requests using beacon.
    'beacon_ajax_usage': window.performance.getEntriesByType('resource').filter(r => r.initiatorType === 'beacon').length
});