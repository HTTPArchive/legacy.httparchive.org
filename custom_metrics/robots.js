// [robots]

/* Custom Metric: Parses rendered, raw, as well as iframe documents and reports on meta robots and X-Robots-Tag values.
   Created: May 24, 2022
*/

try {

	const response_bodies = $WPT_BODIES;

	const valid_types = ["noindex", "index", "follow", "none", "nofollow", "noarchive", "nosnippet", "unavailable_after", "max-snippet", "max-image-preview", "max-video-preview", "notranslate", "noimageindex", "nocache", "indexifembedded"];

	const noindex_types = ["noindex", "none"];
	const nofollow_types = ["noindex", "none", "nofollow"];

	const common_bots = ["bingbot", "msnbot", "google", "googlebot", "googlebot-news", "googleweblight", "robots", "otherbot"];

	function getDocumentIframes() {
		return new Set(Array.from(document.querySelectorAll('iframe')).map(iframe=>iframe.src).filter(url=>url.length));
	}

	function getResponseHeaders(response_headers, name) {
		return response_headers[name]?.split("\n");
	}

	function getHTMLDocument(source) {
		let rawDocument = document.implementation.createHTMLDocument("New Iframe Document");
		rawDocument.documentElement.innerHTML = source;
		return rawDocument;
	}

	function getResponseBodyEntriesForURLs(urlSet) {
		return response_bodies.filter(har=>{
			return urlSet.has(har.url);
		}
		).map(har=>{
			return [har.url, har.response_body, har.response_headers];
		}
		);
	}

	function getHTMLRobotsMeta(doc) {
		let common_bots_set = new Set(common_bots);
		return Object.fromEntries(Array.from(doc.querySelectorAll('meta')).map(meta=>{
			let name = meta.getAttribute('name') || "";
			let content = meta.getAttribute('content') || "";
			return [name.trim().toLowerCase(), content.trim().toLowerCase()];
		}).filter(item=>common_bots_set.has(item[0])));
	}

	function getHeaderRobotsMeta(headers) {
		let common_bots_set = new Set(common_bots);
		return Object.fromEntries(Array.from(headers).map(robots=>{
			let parts = robots.trim().toLowerCase().split(':');
			return [parts.shift(), parts.join(':')];
		}
		).filter(item=>common_bots_set.has(item[0])));

	}

	function formatRobotsContent(content) {
		let valid_types_set = new Set(valid_types);
		let active = new Set(content.split(",").map(part=>part.split(":")[0].trim()).filter(item=>valid_types_set.has(item)));
		let base = Object.fromEntries(Array.from(valid_types).map(k=>[k, false]));
		let active_types = Object.fromEntries(Array.from(active).map(k=>[k, true]));
		return Object.assign(base, active_types);
	}
	
	
	function processRobotsHTML(doc) {
		let robots = getHTMLRobotsMeta(doc)
		return Object.fromEntries(Object.entries(robots).map(item=>[item[0], formatRobotsContent(item[1])]));

	}

	function processRobotsHeaders(headers) {
		let robots = getHeaderRobotsMeta(headers)
		return Object.fromEntries(Object.entries(robots).map(item=>[item[0], formatRobotsContent(item[1])]));

	}

	function processRobotsIframes(bodies) {

		//[har.url, har.response_body, har.response_headers]

		let result_bodies = {};
		let result_headers = {};
		let base = Object.fromEntries(Array.from(valid_types).map(k=>[k, 0]));

		[...bodies].forEach(item=>{
			let doc = getHTMLDocument(item[1]);
			let headers = item[2];

			let robots_bodies = processRobotsHTML(doc);
			for (var bot in robots_bodies) {
				if (!result_bodies.hasOwnProperty(bot)) {
					result_bodies[bot] = Object.assign({}, base);
				}
				[...Object.entries(robots_bodies[bot])].forEach(item=>{
					result_bodies[bot][item[0]] += item[1] ? 1 : 0
				}
				);
			}

			let robots_headers = processRobotsHeaders(headers);
			for (var bot in robots_headers) {
				if (!result_headers.hasOwnProperty(bot)) {
					result_headers[bot] = Object.assign({}, base);
				}
				[...Object.entries(robots_headers[bot])].forEach(item=>{
					result_headers[bot][item[0]] += item[1] ? 1 : 0
				}
				);
			}

		}
		);

		return {
			'bodies': result_bodies,
			'headers': result_headers
		}

	}

	const iframeBodies = getResponseBodyEntriesForURLs(getDocumentIframes());
	const processediFrames = processRobotsIframes(iframeBodies);
	const rawHTMLDocument = getHTMLDocument(response_bodies[0].response_body);
	const renderedHTMLDocument = document;
	const responseHeaders = response_bodies[0].response_headers

	return {
		mainFrameRobotsRendered: processRobotsHTML(renderedHTMLDocument),
		mainFrameRobotsRaw: processRobotsHTML(rawHTMLDocument),
		mainFrameRobotsHeaders: processRobotsHeaders(responseHeaders),
		iFrameRobotsRaw: processediFrames['bodies'],
		iFrameRobotsHeaders: processediFrames['headers']

	};

} catch (err) {
	  console.log(err)
	return {
		error: err.toString()
	};
  
}
