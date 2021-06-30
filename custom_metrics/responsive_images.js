//[responsive-images]
// Uncomment the previous line for testing on webpagetest.org

return JSON.stringify({
	'responsive-images': (() => {

		const imgs = [ ...document.querySelectorAll( 'img' ) ];
		return imgs.map( ( img ) => getImgData( img ) );

	})(),
});



// take a CSS length (as a String)
// return a Number of CSS pixels
//
function resolveLength( cssLengthString ) {

	let cleanup = false,
	    myHTML;

	if ( !document.documentElement ) {
		myHTML = document.createElement( 'html' );
		document.appendChild( myHTML );
		cleanup = true;
	}

	const testDiv = document.createElement( 'div' );
	testDiv.style.fontSize = 'initial';
	testDiv.style.boxSizing = 'border-box';
	document.documentElement.appendChild( testDiv );
	testDiv.style.width = cssLengthString;
	const width = testDiv.getBoundingClientRect().width;

	testDiv.remove();
	if ( cleanup ) {
		myHTML.remove();
	}

	return width;
}

// determine if the user agent will pick a <source> with a given type="${mimeTypeString}"
// takes a String
//
// I was trying to do this the "right" way, but async code and promises got involved, and I give up and am going to hardcode
// source: https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/common/mime_util/mime_util.cc;l=164;drc=c14f6f4b9c44fe479a8d004576b42723b2a5feb6;bpv=0;bpt=1

function matchType( mimeTypeString ) {

	const supportedTypes = [
		"image/jpeg",
		"image/pjpeg",
		"image/jpg",
		"image/webp",
		"image/png",
		"image/apng",
		"image/gif",
		"image/bmp",
		"image/vnd.microsoft.icon",  // ico
		"image/x-icon",              // ico
		"image/x-xbitmap",           // xbm
		"image/x-png",
		"image/avif" // enabled for both desktop and mobile now (2021-06-29), phew
	];
	
	return supportedTypes.includes( mimeTypeString.toLowerCase() );

}

// the candidate <source> elements of a given <picture>
// takes an <img> Element
// returns a plain ol' Array of <source> Elements
function pictureSources( img ) {
	// all <source>s that are direct children of the <picture> and come BEFORE the <img>
	// https://twitter.com/zcorpan/status/1409778636153032706
	if ( img.parentNode.tagName !== "PICTURE" ) {
		throw 'pictureSources( img ) was fed an img that was not the direct child of a picture'
	}
	const picture = img.parentNode;
	let candidates = [];
	for ( let i = 0; i < picture.children.length; i++ ) {
		if ( picture.children[ i ] === img ) {
			break;
		}
		if ( picture.children[ i ].tagName === "SOURCE" ) {
			candidates.push( picture.children[ i ] );
		}
	}
	return candidates;
}

// What are the srcset and sizes attributes currently in effect for a given <img>?
// (in case they are being supplied by a picture > source sibling)
// takes <img> Element
// returns { srcset: [String or null], sizes: [String or null] }

function winningSrcsetAndSizes( img ) {

	if ( img.parentNode.tagName === "PICTURE" ) {

		const picture = img.parentNode,
		      sources = pictureSources( img );

		for ( const source of sources ) {

			let mediaMatches = true,
			    typeMatches = true;

			if ( source.hasAttribute( 'media' ) ) {
				mediaMatches = window.matchMedia( source.getAttribute( 'media' ) );
			}

			if ( source.hasAttribute( 'type' ) ) {
				typeMatches = matchType( source.getAttribute( 'type' ) );
			}

			if ( mediaMatches && typeMatches ) {
				return {
					srcset: source.getAttribute('srcset'),
					sizes: source.getAttribute('sizes'),
					isFromSource: true
				};
			}
		}

	} // end if picture
	
	return {
		srcset: img.getAttribute('srcset'),
		sizes: img.getAttribute('sizes'),
		isFromSource: false
	};

}


// How many unique candidate resources does this <img> have?
// takes <img> Element
// returns a Number
function totalNumberOfCandidates( img ) {

	const candidateURLs = new Set();

	if ( img.hasAttribute( 'src' ) ) {
		candidateURLs.add( img.getAttribute( 'src' ) );
	}

	if ( img.hasAttribute( 'srcset' ) ) {
		const parsedSrcset = parseSrcset( img.getAttribute( 'srcset' ) ).candidates;
		parsedSrcset.forEach( candidate => {
			candidateURLs.add( candidate.url );
		} )
	}

	if ( img.parentNode.tagName === "PICTURE" ) {
		const picture = img.parentNode,
		      sources = pictureSources( img );
		sources.forEach( source => {
			if ( source.hasAttribute( 'srcset' ) ) {
				const parsedSrcset = parseSrcset( source.getAttribute( 'srcset' ) ).candidates;
				parsedSrcset.forEach( candidate => {
					candidateURLs.add( candidate.url );
				} )
			}
		} );
	}

	candidateURLs.delete( '' ); // in case there are empties...
	return candidateURLs.size;

}

// Is a <picture> doing media and/or type switching?
// takes an <img> Element that's a direct descendant of a <picture>
// returns {
// 	mediaSwitching: Boolean,
// 	typeSwitching: Boolean
// }
function pictureFeatures( img ) {

	let mediaSwitching = false,
	    typeSwitching = false;

	if ( img.parentNode.tagName !== "PICTURE" ) {
		throw 'pictureFeatures() expected an <img> Element with a <picture> parent as input but received something else'
	}

	const sources = pictureSources( img );
	sources.forEach( source => {
		if ( source.hasAttribute( 'media' ) ) {
			mediaSwitching = true;
		}
		if ( source.hasAttribute( 'type' ) ) {
			typeSwitching = true;
		}
	} );

	return { mediaSwitching, typeSwitching };

}

// Is a srcset using x or w descriptors?
// takes a parsed srcset array (the `candidates` attribute from the ouput of the parseSrcset() function)
// returns {
// 	xDescriptors: Boolean,
// 	wDescriptors: Boolean
// }
function srcsetFeatures( parsedSrcset ) {

	const resourcesWithWDescriptors = parsedSrcset.filter( 
		o => o.hasOwnProperty( 'w' )
	);
	const resourcesWithXDescriptors = parsedSrcset.filter( 
		o => o.hasOwnProperty( 'd' )
	);

	return {
		xDescriptors: resourcesWithXDescriptors.length > 0,
		wDescriptors: resourcesWithWDescriptors.length > 0
	}

}

// What features is an <img> using>?
// takes an <img> Element
// returns {
// 	hasSrc: Boolean,
// 	hasAlt: Boolean,
// 	isInPicture:  Boolean,
// 	hasCustomDataAttributes: Boolean,
// 	hasWidth: Boolean,
// 	hasHeight: Boolean
// }
// we check for srcset and sizes use separately, in order to consider values supplied by the parent <picture> / <source> siblings
// TODO consider loading (although there's already a metric for this?), decode,  crossorigin, referrerpolicy
function imgFeatures( img ) {

	return {
		hasSrc: img.hasAttribute( 'src' ),
		hasAlt: img.hasAttribute( 'alt' ),
		isInPicture: img.parentNode.tagName === "PICTURE",
		hasCustomDataAttributes: Object.keys( img.dataset ).length > 0,
		hasWidth: img.hasAttribute( 'width' ) &&
		          parseInt( img.getAttribute( 'width' ) ) > 0,
		hasHeight: img.hasAttribute( 'height' ) &&
		           parseInt( img.getAttribute( 'height' ) ) > 0
	}

}


// get the computed values of the CSS rules that size the <img>
// note that these are computed values, so things like "100%" have already been resolved into px, boo
// takes an <img> Element
// returns an object with camelCased rule names as keys and strings representing serialized CSS values as values
// 
function computedSizingStyles( img ) {

	const computedStyles = img.computedStyleMap();

	return {
		width: computedStyles.get('width').toString(),
		height: computedStyles.get('height').toString(),
		maxWidth: computedStyles.get('max-width').toString(),
		maxHeight: computedStyles.get('max-height').toString(),
		minWidth: computedStyles.get('min-width').toString(),
		minHeight: computedStyles.get('min-height').toString()
	}

}

// is the image intrinsically or extrinsically sized? (or both, via max or min-width constraints that only kick in sometimes)
// takes object returned from computedSizingStyles( img )
// returns { width, height } where width and height can be one of: "extrinsic", "intrinsic", or "both"
function intrinsicOrExtrinsicSizing( computedStyles ) {

	let width;
	if ( computedStyles.width === "auto" ) {
		if ( computedStyles.maxWidth === "none" && computedStyles.minWidth === "auto" ) {
			width = "intrinsic";
		} else {
			width = "both";
		}
	} else {
		width = "extrinsic";
	}
	let height;
	if ( computedStyles.height === "auto" ) {
		if ( computedStyles.maxHeight === "none" && computedStyles.minHeight === "auto" ) {
			height = "intrinsic";
		} else {
			height = "both";
		}
	} else {
		height = "extrinsic";
	}

	return { width, height }

}


function getImgData( img ) {
	
	const imgData = imgFeatures( img );
	imgData.url = img.currentSrc || img.src;
	imgData.totalCandidates = totalNumberOfCandidates( img );
	
	if ( imgData.isInPicture ) {
		const pictureFeatures_ = pictureFeatures( img );
		imgData.pictureMediaSwitching = pictureFeatures_.mediaSwitching;
		imgData.pictureTypeSwitching = pictureFeatures_.typeSwitching;
	}
	
	const { srcset, sizes, isFromSource } = winningSrcsetAndSizes( img );
	
	imgData.hasSrcset = Boolean( srcset );
	imgData.hasSizes = Boolean( sizes );
	
	let srcsetCandidates,
	    parsedSrcset; // need these in scope here to set in this if block, and read in later ones
	    // TODO: do I want to return any of these in imgData?
	if ( imgData.hasSrcset ) {
		parsedSrcset = parseSrcset( srcset );
		srcsetCandidates = parsedSrcset.candidates;
		imgData.srcsetParseError = parsedSrcset.parseError;
		srcsetFeatures_ = srcsetFeatures( parsedSrcset.candidates );
		imgData.srcsetHasXDescriptors = srcsetFeatures_.xDescriptors;
		imgData.srcsetHasWDescriptors = srcsetFeatures_.wDescriptors;

		/* If child has a src or href attribute whose value is not the empty string and source set does not contain an image source with a pixel density descriptor value of 1, and no image source with a width descriptor, append child's src or href attribute value to source set.
		https://html.spec.whatwg.org/multipage/images.html#updating-the-source-set
		*/
		if ( imgData.hasSrc &&
		     img.getAttribute( 'src' ) !== '' && 
		     !( srcsetCandidates.filter( c => c.d === 1 ).length > 0 ) &&
		     !isFromSource &&
		     !( imgData.srcsetHasWDescriptors ) ) {
			srcsetCandidates.push( {
				url: img.getAttribute( 'src' )
			} )
		}

	}

	// figure out the resolved sizes size
	// (e.g., `sizes="calc(100vw - 50px)` on an 800-pixel-wide viewport -> `750`)
	if ( imgData.hasSizes ) {

		const parsedSizes = parseSizes( sizes );
		imgData.sizesWidth = resolveLength( parsedSizes.size );
		imgData.sizesParseError = parsedSizes.parseError;
		imgData.sizesWasImplicit = false;

	} else if ( imgData.srcsetHasWDescriptors ) { // if you use srcset with w descriptors, but do not include a sizes attribute, the default value of sizes = 100vw is used

		imgData.sizesWasImplicit = true;
		imgData.sizesWidth = resolveLength( '100vw' );

	}

	// if we have a sizes width (either implicit or explicit), check it against the actual width of the image, and capture the error
	if ( imgData.sizesWidth ) {
		imgData.layoutWidth = img.clientWidth;
		imgData.sizesAbsoluteError = imgData.sizesWidth - imgData.layoutWidth;
		imgData.sizesRelativeError = imgData.sizesAbsoluteError / imgData.layoutWidth;
	}

	// determine the effective densities of the srcset resources
	// whether they use w descriptors, or x descriptors
	//
	// note: modifies srcsetCandidates in place
	if ( srcsetCandidates ) {
		srcsetCandidates.forEach( i => {
			if ( i.hasOwnProperty( 'd' ) ) {
				i.density = i.d;
			} else if ( i.hasOwnProperty( 'w' ) && imgData.sizesWidth && imgData.sizesWidth > 0 ) {
				i.density = i.w / imgData.sizesWidth;
			} else {
				i.density = 1;
			}
		} );
	}

	// report all of the srcset candidate densities
	if ( srcsetCandidates ) {
		imgData.srcsetCandidateDensities = srcsetCandidates.map( 
			i => i.density
		)
	}

	// figure out the density of the selected resource
	//
	// by default, img resource density on the web is 1
	imgData.currentSrcDensity = 1;
	// but it can be modified by srcset
	if ( srcsetCandidates ) {
		const informationFromSrcsetAboutTheCurrentSrc = srcsetCandidates.find(
			o => o.url === img.currentSrc
		);
		if ( informationFromSrcsetAboutTheCurrentSrc &&
		     informationFromSrcsetAboutTheCurrentSrc.density ) {
			imgData.currentSrcDensity = informationFromSrcsetAboutTheCurrentSrc.density;
		}
	}

	// figure out the density UN-corrected dimensions of the currentSrc
	// note: can only be approximate because naturalWidth/Height are rounded!
	if ( imgData.currentSrcDensity ) {
		imgData.approximateResourceWidth = Math.round( img.naturalWidth * imgData.currentSrcDensity );
		imgData.approximateResourceHeight = Math.round( img.naturalHeight * imgData.currentSrcDensity );
	}

	const wptRequest = $WPT_REQUESTS.find( req => req.url === imgData.url );

	// figure out the bytesize of the image resource
	if ( window.PerformanceResourceTiming ) {
		const performanceEntries = window.performance.getEntriesByName( imgData.url, 'resource' );
		if ( performanceEntries[ 0 ] &&
		     performanceEntries[ 0 ].decodedBodySize &&
		     performanceEntries[ 0 ].decodedBodySize > 0 ) {
			imgData.byteSize = performanceEntries[ 0 ].decodedBodySize;
		} else {
			// ok that was fun, but we probably didn't get a Timing-Allow-Origin header on cross-origin resources to allow us to do it. So, look at WebPageTest's data.
			// first... if the browser won't tell us, maybe the server will
			if (
				wptRequest &&
				wptRequest.response_headers &&
				wptRequest.response_headers['content-length'] && 
				parseInt( wptRequest.response_headers['content-length'] ) > 0 
			) {
				imgData.byteSize = parseInt( wptRequest.response_headers['content-length'] );
			} else if (
				// if the server didn't send a content-length (?), use WPT's transfer_size, which includes HTTP headers and is possibly encoded, but is the best we can do
				wptRequest &&
				wptRequest.transfer_size
			) {
				imgData.byteSize = parseInt( wptRequest.transfer_size );
			}
		}
	}
	
	// figure out the approximate bits/pixel of the loaded resource!
	if (
		imgData.approximateResourceWidth && 
		imgData.approximateResourceHeight && 
		imgData.byteSize
	) {
		imgData.bitsPerPixel = ( imgData.byteSize * 8 ) / ( imgData.approximateResourceWidth * imgData.approximateResourceHeight );
	}

	// get the server-reported mime type of the image
	if (
		wptRequest &&
		wptRequest.response_headers
	) {
		imgData.mimeType = wptRequest.response_headers['content-type'];
	}

	// get the sizing styles applied to the img
	imgData.computedSizingStyles = computedSizingStyles( img );
	
	// is the image being extrinsically sized in either dimension? Or is it left to its intrinsic dimensions?
	imgData.intrinsicOrExtrinsicSizing = intrinsicOrExtrinsicSizing( imgData.computedSizingStyles );
	
	// is this image reserving layout dimensions using the width and height attributes, despite being intrinsically sized in at least one dimension?
	// https://twitter.com/jensimmons/status/1172922185570279425
	imgData.reservedLayoutDimensions = (
		imgData.hasWidth && imgData.hasHeight &&
		Object.values( imgData.intrinsicOrExtrinsicSizing ).includes( 'intrinsic' )
	);

	return imgData;

}

/*
 * Sizes Parser
 *
 * By Alex Bell |  MIT License
 *
 * Non-strict but accurate and lightweight JS Parser for the string value <img sizes="here">
 *
 * Reference algorithm at:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-sizes-attribute
 *
 * Most comments are copied in directly from the spec
 * (except for comments in parens).
 *
 * Grammar is:
 * <source-size-list> = <source-size># [ , <source-size-value> ]? | <source-size-value>
 * <source-size> = <media-condition> <source-size-value>
 * <source-size-value> = <length>
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content.html#attr-img-sizes
 *
 * E.g. "(max-width: 30em) 100vw, (max-width: 50em) 70vw, 100vw"
 * or "(min-width: 30em), calc(30em - 15px)" or just "30vw"
 *
 * Returns the first valid <css-length> with a media condition that evaluates to true,
 * or "100vw" if all valid media conditions evaluate to false.
 *
 */

function parseSizes(strValue) {

	let parseError = false;

	// (Percentage CSS lengths are not allowed in this case, to avoid confusion:
	// https://html.spec.whatwg.org/multipage/embedded-content.html#valid-source-size-list
	// CSS allows a single optional plus or minus sign:
	// http://www.w3.org/TR/CSS2/syndata.html#numbers
	// CSS is ASCII case-insensitive:
	// http://www.w3.org/TR/CSS2/syndata.html#characters )
	// Spec allows exponential notation for <number> type:
	// http://dev.w3.org/csswg/css-values/#numbers
	var regexCssLengthWithUnits = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?(?:ch|cm|em|ex|in|mm|pc|pt|px|rem|vh|vmin|vmax|vw)$/i,

	// (This is a quick and lenient test. Because of optional unlimited-depth internal
	// grouping parens and strict spacing rules, this could get very complicated.)
	    regexCssCalc = /^calc\((?:[0-9a-z \.\+\-\*\/\(\)]+)\)$/i,
	    i, unparsedSizesList, unparsedSizesListLength, unparsedSize, lastComponentValue, size;

	// UTILITY FUNCTIONS

	// ( Manual is faster than RegEx.)
	// http://jsperf.com/whitespace-character/5
	function isSpace(c) {
		return (c === "\u0020" || // space
		        c === "\u0009" || // horizontal tab
		        c === "\u000A" || // new line
		        c === "\u000C" || // form feed
		        c === "\u000D");  // carriage return
	}

	//  (Toy CSS parser. The goals here are:
	//  1) expansive test coverage without the weight of a full CSS parser.
	//  2) Avoiding regex wherever convenient.
	//  Quick tests: http://jsfiddle.net/gtntL4gr/3/
	//  Returns an array of arrays.)
	function parseComponentValues(str) {
		var chrctr,
		    component = "",
		    componentArray = [],
		    listArray = [],
		    parenDepth = 0,
		    pos = 0,
		    inComment = false;

		function pushComponent() {
			if (component) {
				componentArray.push(component);
				component = "";
			}
		}

		function pushComponentArray() {
			if (componentArray[ 0 ]) {
				listArray.push(componentArray);
				componentArray = [];
			}
		}

		// (Loop forwards from the beginning of the string.)
		while (true) {
			chrctr = str.charAt(pos);

		if (chrctr === "") { // ( End of string reached.)
			pushComponent();
			pushComponentArray();
			return listArray;
		} else if (inComment) {
			if ( (chrctr === "*") && (str.charAt(pos + 1) === "/") ) { // (At end of a comment.)
				inComment = false;
				pos += 2;
				pushComponent();
				continue;
			} else {
				pos += 1; // (Skip all characters inside comments.)
				continue;
			}
		} else if (isSpace(chrctr)) {
			// (If previous character in loop was also a space, or if
			// at the beginning of the string, do not add space char to
			// component.)
			if ((str.charAt(pos - 1) && isSpace(str.charAt(pos - 1) ) ) || (!component)) {
				pos += 1;
				continue;
			} else if (parenDepth === 0) {
				pushComponent();
				pos += 1;
				continue;
			} else {
				// (Replace any space character with a plain space for legibility.)
				chrctr = " ";
			}
		} else if (chrctr === "(") {
			parenDepth += 1;
		} else if (chrctr === ")") {
			parenDepth -= 1;
		} else if (chrctr === ",") {
			pushComponent()
			pushComponentArray();
			pos += 1;
			continue;
		} else if ( (chrctr === "/") && (str.charAt( pos + 1 ) === "*") ) {
			inComment = true;
			pos += 2;
			continue;
		}

		component = component + chrctr;
		pos += 1;
		}
	}

	function isValidNonNegativeSourceSizeValue(s) {
		if (regexCssLengthWithUnits.test(s) && (parseFloat(s) >= 0)) {return true;}
		if (regexCssCalc.test(s)) {return true;}
		// ( http://www.w3.org/TR/CSS2/syndata.html#numbers says:
		// "-0 is equivalent to 0 and is not a negative number." which means that
		// unitless zero and unitless negative zero must be accepted as special cases.)
		if ((s === "0") || (s === "-0") || (s === "+0")) {return true;}
		return false;
	}

	// When asked to parse a sizes attribute from an element, parse a
	// comma-separated list of component values from the value of the element's
	// sizes attribute (or the empty string, if the attribute is absent), and let
	// unparsed sizes list be the result.
	// http://dev.w3.org/csswg/css-syntax/#parse-comma-separated-list-of-component-values

	unparsedSizesList = parseComponentValues(strValue);
	unparsedSizesListLength = unparsedSizesList.length;

// For each unparsed size in unparsed sizes list:
	for (i = 0; i < unparsedSizesListLength; i++) {
		unparsedSize = unparsedSizesList[ i ];

		// 1. Remove all consecutive <whitespace-token>s from the end of unparsed size.
		// ( parseComponentValues() already omits spaces outside of parens. )

		// If unparsed size is now empty, that is a parse error; continue to the next
		// iteration of this algorithm.
		// ( parseComponentValues() won't push an empty array. )

		// 2. If the last component value in unparsed size is a valid non-negative
		// <source-size-value>, let size be its value and remove the component value
		// from unparsed size. Any CSS function other than the calc() function is
		// invalid. Otherwise, there is a parse error; continue to the next iteration
		// of this algorithm.
		// http://dev.w3.org/csswg/css-syntax/#parse-component-value
		lastComponentValue = unparsedSize[ unparsedSize.length - 1 ];

		if (isValidNonNegativeSourceSizeValue(lastComponentValue)) {
			size = lastComponentValue;
			unparsedSize.pop();
		} else {
			parseError = true;
			if (window.console && console.log) {
				// console.log("Parse error: " + strValue);
				continue;
			}
		}

		// 3. Remove all consecutive <whitespace-token>s from the end of unparsed
		// size. If unparsed size is now empty, return size and exit this algorithm.
		// If this was not the last item in unparsed sizes list, that is a parse error.
		if (unparsedSize.length === 0) {
			if (i !== unparsedSizesListLength - 1) {
				parseError = true;
				if (window.console && console.log) {
					// console.log("Parse error: " + strValue);
				}
			}
			return { size, parseError };
		}

		// 4. Parse the remaining component values in unparsed size as a
		// <media-condition>. If it does not parse correctly, or it does parse
		// correctly but the <media-condition> evaluates to false, continue to the
		// next iteration of this algorithm.
		// (Parsing all possible compound media conditions in JS is heavy, complicated,
		// and the payoff is unclear. Is there ever an situation where the
		// media condition parses incorrectly but still somehow evaluates to true?
		// Can we just rely on the browser/polyfill to do it?)
		unparsedSize = unparsedSize.join(" ");
		if (!(window.matchMedia(unparsedSize).matches) ) {
			continue;
		}

		// 5. Return size and exit this algorithm.
		return { size, parseError };
	}

	// If the above algorithm exhausts unparsed sizes list without returning a
	// size value, return 100vw.
	return { size: "100vw", parseError };
}


/**
 * Srcset Parser
 *
 * By Alex Bell |  MIT License
 *
 * JS Parser for the string value that appears in markup <img srcset="here">
 *
 * @returns Array [{url: _, d: _, w: _, h:_}, ...]
 *
 * Based super duper closely on the reference algorithm at:
 * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-srcset-attribute
 *
 * Most comments are copied in directly from the spec
 * (except for comments in parens).
 */

function parseSrcset(input) {

	// UTILITY FUNCTIONS

	// Manual is faster than RegEx
	// http://bjorn.tipling.com/state-and-regular-expressions-in-javascript
	// http://jsperf.com/whitespace-character/5
	function isSpace(c) {
		return (c === "\u0020" || // space
		c === "\u0009" || // horizontal tab
		c === "\u000A" || // new line
		c === "\u000C" || // form feed
		c === "\u000D");  // carriage return
	}

	function collectCharacters(regEx) {
		var chars,
			match = regEx.exec(input.substring(pos));
		if (match) {
			chars = match[ 0 ];
			pos += chars.length;
			return chars;
		}
	}

	var inputLength = input.length,

		// (Don't use \s, to avoid matching non-breaking space)
		regexLeadingSpaces = /^[ \t\n\r\u000c]+/,
		regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/,
		regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/,
		regexTrailingCommas = /[,]+$/,
		regexNonNegativeInteger = /^\d+$/,

		// ( Positive or negative or unsigned integers or decimals, without or without exponents.
		// Must include at least one digit.
		// According to spec tests any decimal point must be followed by a digit.
		// No leading plus sign is allowed.)
		// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
		regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/,

		url,
		descriptors,
		currentDescriptor,
		state,
		c,

		// 2. Let position be a pointer into input, initially pointing at the start
		//    of the string.
		pos = 0,

		// 3. Let candidates be an initially empty source set.
		candidates = [];
		// eric added this
		parseError = false;

	// 4. Splitting loop: Collect a sequence of characters that are space
	//    characters or U+002C COMMA characters. If any U+002C COMMA characters
	//    were collected, that is a parse error.
	while (true) {
		collectCharacters(regexLeadingCommasOrSpaces);

		// 5. If position is past the end of input, return candidates and abort these steps.
		if (pos >= inputLength) {
			return { candidates, parseError }; // (we're done, this is the sole return path)
		}

		// 6. Collect a sequence of characters that are not space characters,
		//    and let that be url.
		url = collectCharacters(regexLeadingNotSpaces);

		// 7. Let descriptors be a new empty list.
		descriptors = [];

		// 8. If url ends with a U+002C COMMA character (,), follow these substeps:
		//		(1). Remove all trailing U+002C COMMA characters from url. If this removed
		//         more than one character, that is a parse error.
		if (url.slice(-1) === ",") {
			url = url.replace(regexTrailingCommas, "");
			// (Jump ahead to step 9 to skip tokenization and just push the candidate).
			parseDescriptors();

			//	Otherwise, follow these substeps:
		} else {
			tokenize();
		} // (close else of step 8)

		// 16. Return to the step labeled splitting loop.
	} // (Close of big while loop.)

	/**
	 * Tokenizes descriptor properties prior to parsing
	 * Returns undefined.
	 */
	function tokenize() {

		// 8.1. Descriptor tokeniser: Skip whitespace
		collectCharacters(regexLeadingSpaces);

		// 8.2. Let current descriptor be the empty string.
		currentDescriptor = "";

		// 8.3. Let state be in descriptor.
		state = "in descriptor";

		while (true) {

			// 8.4. Let c be the character at position.
			c = input.charAt(pos);

			//  Do the following depending on the value of state.
			//  For the purpose of this step, "EOF" is a special character representing
			//  that position is past the end of input.

			// In descriptor
			if (state === "in descriptor") {
				// Do the following, depending on the value of c:

				// Space character
				// If current descriptor is not empty, append current descriptor to
				// descriptors and let current descriptor be the empty string.
				// Set state to after descriptor.
				if (isSpace(c)) {
					if (currentDescriptor) {
						descriptors.push(currentDescriptor);
						currentDescriptor = "";
						state = "after descriptor";
					}

					// U+002C COMMA (,)
					// Advance position to the next character in input. If current descriptor
					// is not empty, append current descriptor to descriptors. Jump to the step
					// labeled descriptor parser.
				} else if (c === ",") {
					pos += 1;
					if (currentDescriptor) {
						descriptors.push(currentDescriptor);
					}
					parseDescriptors();
					return;

					// U+0028 LEFT PARENTHESIS (()
					// Append c to current descriptor. Set state to in parens.
				} else if (c === "\u0028") {
					currentDescriptor = currentDescriptor + c;
					state = "in parens";

					// EOF
					// If current descriptor is not empty, append current descriptor to
					// descriptors. Jump to the step labeled descriptor parser.
				} else if (c === "") {
					if (currentDescriptor) {
						descriptors.push(currentDescriptor);
					}
					parseDescriptors();
					return;

					// Anything else
					// Append c to current descriptor.
				} else {
					currentDescriptor = currentDescriptor + c;
				}
				// (end "in descriptor"

				// In parens
			} else if (state === "in parens") {

				// U+0029 RIGHT PARENTHESIS ())
				// Append c to current descriptor. Set state to in descriptor.
				if (c === ")") {
					currentDescriptor = currentDescriptor + c;
					state = "in descriptor";

					// EOF
					// Append current descriptor to descriptors. Jump to the step labeled
					// descriptor parser.
				} else if (c === "") {
					descriptors.push(currentDescriptor);
					parseDescriptors();
					return;

					// Anything else
					// Append c to current descriptor.
				} else {
					currentDescriptor = currentDescriptor + c;
				}

				// After descriptor
			} else if (state === "after descriptor") {

				// Do the following, depending on the value of c:
				// Space character: Stay in this state.
				if (isSpace(c)) {

					// EOF: Jump to the step labeled descriptor parser.
				} else if (c === "") {
					parseDescriptors();
					return;

					// Anything else
					// Set state to in descriptor. Set position to the previous character in input.
				} else {
					state = "in descriptor";
					pos -= 1;

				}
			}

			// Advance position to the next character in input.
			pos += 1;

			// Repeat this step.
		} // (close while true loop)
	}

	/**
	 * Adds descriptor properties to a candidate, pushes to the candidates array
	 * @return undefined
	 */
	// Declared outside of the while loop so that it's only created once.
	function parseDescriptors() {

		// 9. Descriptor parser: Let error be no.
		var pError = false,

			// 10. Let width be absent.
			// 11. Let density be absent.
			// 12. Let future-compat-h be absent. (We're implementing it now as h)
			w, d, h, i,
			candidate = {},
			desc, lastChar, value, intVal, floatVal;

		// 13. For each descriptor in descriptors, run the appropriate set of steps
		// from the following list:
		for (i = 0 ; i < descriptors.length; i++) {
			desc = descriptors[ i ];

			lastChar = desc[ desc.length - 1 ];
			value = desc.substring(0, desc.length - 1);
			intVal = parseInt(value, 10);
			floatVal = parseFloat(value);

			// If the descriptor consists of a valid non-negative integer followed by
			// a U+0077 LATIN SMALL LETTER W character
			if (regexNonNegativeInteger.test(value) && (lastChar === "w")) {

				// If width and density are not both absent, then let error be yes.
				if (w || d) {pError = true;}

				// Apply the rules for parsing non-negative integers to the descriptor.
				// If the result is zero, let error be yes.
				// Otherwise, let width be the result.
				if (intVal === 0) {pError = true;} else {w = intVal;}

				// If the descriptor consists of a valid floating-point number followed by
				// a U+0078 LATIN SMALL LETTER X character
			} else if (regexFloatingPoint.test(value) && (lastChar === "x")) {

				// If width, density and future-compat-h are not all absent, then let error
				// be yes.
				if (w || d || h) {pError = true;}

				// Apply the rules for parsing floating-point number values to the descriptor.
				// If the result is less than zero, let error be yes. Otherwise, let density
				// be the result.
				if (floatVal < 0) {pError = true;} else {d = floatVal;}

				// If the descriptor consists of a valid non-negative integer followed by
				// a U+0068 LATIN SMALL LETTER H character
			} else if (regexNonNegativeInteger.test(value) && (lastChar === "h")) {

				// If height and density are not both absent, then let error be yes.
				if (h || d) {pError = true;}

				// Apply the rules for parsing non-negative integers to the descriptor.
				// If the result is zero, let error be yes. Otherwise, let future-compat-h
				// be the result.
				if (intVal === 0) {pError = true;} else {h = intVal;}

				// Anything else, Let error be yes.
			} else {pError = true;}
		} // (close step 13 for loop)

		// 15. If error is still no, then append a new image source to candidates whose
		// URL is url, associated with a width width if not absent and a pixel
		// density density if not absent. Otherwise, there is a parse error.
		if (!pError) {
			candidate.url = url;
			if (w) { candidate.w = w;}
			if (d) { candidate.d = d;}
			if (h) { candidate.h = h;}
			candidates.push(candidate);
		} else {
			parseError = true; // eric's global parserror, not just candidate specific
			if (console && console.log) {
				// console.log("Invalid srcset descriptor found in '" +
				//	input + "' at '" + desc + "'.");
			}
		}
	} // (close parseDescriptors fn)

}