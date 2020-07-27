return JSON.stringify({
	"iframe-allow": [].map.call(document.querySelectorAll('iframe[allow]'), (x) => {
		return {
			"allow": x.getAttribute('allow'),
			"src": x.getAttribute(src)
		}
	}),
	"iframe-sandbox": [].map.call(document.querySelectorAll('iframe[sandbox]'), (x) => {
		return {
			"sandbox": x.getAttribute('sandbox'),
			"src": x.getAttribute(src)
		}
	}),
	"sri-integrity": [].map.call(document.querySelectorAll('[integrity]'), (x) => {
		return {
			"integrity": x.getAttribute('integrity'),
			"src": x.getAttribute(src),
			"tagname": x.tagName.toLowerCase()
		}
	})
});