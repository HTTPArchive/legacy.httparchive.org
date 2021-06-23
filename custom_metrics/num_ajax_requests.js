var ajax_apis = ['xmlhttprequest', 'fetch', 'beacon']
return window.performance.getEntriesByType('resource').filter(r => ajax_apis.includes(r.initiatorType)).length