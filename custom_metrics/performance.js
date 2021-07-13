//[performance]

const response_bodies = $WPT_BODIES;

function getLcpElement() {
    return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
            const lcpCandidates = entryList.getEntries();
            const naiveLcpEntry = lcpCandidates[lcpCandidates.length - 1];

            resolve(naiveLcpEntry);
        }).observe({ type: "largest-contentful-paint", buffered: true });
    }).then(({ startTime, element, url, size, loadTime, renderTime }) => {
        let attributes = [];
        for (let index = 0; index < element.attributes.length; index++) {
            const ele = element.attributes.item(index);
            attributes[index] = { name: ele.name, value: ele.value };
        }

        return {
            startTime,
            nodeName: element.nodeName,
            url,
            size,
            loadTime,
            renderTime,
            attributes,
        };
    });
}

function getWebVitalsJS() {
    const webVitalsJSPattern = /webVitals[\s\S]+8999999999999[\s\S]+1e12[\s\S]+(largest-contentful-paint|first-input|layout-shift)/m;
    return response_bodies.filter(har => {
        return webVitalsJSPattern.test(har.response_body);
    }).map(har => har.url);
}

return Promise.all([getLcpElement()]).then(lcp_elem_stats => {
    return {
        lcp_elem_stats,
        web_vitals_js: getWebVitalsJS()
    };
});
