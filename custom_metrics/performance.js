//[performance]

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

return Promise.all([getLcpElement()]).then(lcp_elem_stats => {
    return {
        lcp_elem_stats
    };
});