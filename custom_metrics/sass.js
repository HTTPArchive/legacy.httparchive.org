//[sass]
const SassFunctions = [
	// Color
	"color.adjust", "adjust-color",
	"color.scale", "scale-color",
	"color.change",
	"adjust-hue",
	"opacity",
	"darken", "lighten",
	"desaturate", "saturate",
	"opacify", "transparentize",
	"fade-in", "fade-out",

	...[
		"red", "green", "blue",
		"hue", "saturation", "lightness",
		"alpha", "complement",
		"grayscale",
		"ie-hex-str",
		"invert",
		"mix"
	].flatMap(n => ["color." + n, n]),

	// List
	"list.separator", "list-separator",

	...[
		"append", "index", "is-bracketed", "join",
	 "length", "set-nth", "nth", "zip"
	].flatMap(n => ["list." + n, n]),

	// Map
	...[
		"get", "has-key", "keys", "merge", "remove", "values"
	].flatMap(n => ["map." + n, "map-" + n]),

	// Math
	...[
		"ceil", "floor", "round",
		"clamp", "min", "max",
		"abs", "comparable", "unit", "percentage", "random"
	].flatMap(n => ["math." + n, n]),
	"math.hypot", "math.log", "math.pow", "math.sqrt",
	"math.sin", "math.cos", "math.tan",
	"math.asin", "math.acos", "math.atan", "math.atan2",
	"math.is-unitless", "unitless",

	// Meta
	"meta.load-css",
	"meta.module-functions", "meta.module-variables",
	...[
		"call", "get-function", "keywords",
		"content-exists", "feature-exists", "function-exists", "global-variable-exists", "variable-exists", "mixin-exists",
		"inspect", "type-of"
	].flatMap(n => ["meta." + n, n]),

	"if"
];

const sortObject = (obj, f = x => x) => Object.fromEntries(Object.entries(obj).sort((a, b) => f(b[1]) - f(a[1])));

function analyzeSCSS(scss, ret) {
	if (!scss) {
		return null;
	}

	// Drop (most) comments to minimize false positives since we have to parse with regexes
	// We want to be conservative here and err on the side of NOT removing comments
	scss = scss.replace(/^\s*\/\*[\s\S]*?\*\//mg, "");
	scss = scss.replace(/^\s*\/\/.+/mg, "");

	// Most popular variable names
	ret.variables = {};
	scss.replace(/\$[\w-]+\b/g, variable => {
		ret.variables[variable] = (ret.variables[variable] || 0) + 1;
	});
	ret.variables = sortObject(ret.variables);

	// Mixins
	// Note: We are not taking the Indented Mixin Syntax into account
	ret.mixins = {};
	scss.replace(/@mixin\s+([\w-]+)(?:\((.+?)\))?/g, ($0, name, args) => {
		// Note: - and _ are equivalent in mixin names and refer to the same mixin
		//         we are not taking that into account here. This applies to functions too (below)
		ret.mixins[name] = {
			// Default values can't have commas, so split should work
			args: args?.split(/\s*,\s*/), // TODO separate name from default value?
			calls: scss.match(RegExp("@include\\s+" + name + "\\b", "gi"))?.length
		};
	});
	ret.mixins = sortObject(ret.mixins, o => o.calls);

	// Custom functions
	ret.functions = {};
	let lastName; // used to track down the nearest @return after a @function
	scss.replace(/@function\s+([\w-]+)(?:\((.+?)\))?|@return (.+)/g, ($0, name, args, returnValue) => {
		if ($0.indexOf("@return") === 0 && lastName) {
			ret.functions[lastName].returns = ret.functions[lastName].returns || [];
			ret.functions[lastName].returns.push(returnValue);
			return $0;
		}

		lastName = name;
		ret.functions[name] = {
			// Default values can't have commas, so split should work
			args: args?.split(/\s*,\s*/), // TODO separate name from default value?
			calls: scss.match(RegExp("\\b" + name + "\\(", "gi"))?.length
		};
	});
	ret.functions = sortObject(ret.functions, o => o.calls);

	// TODO Measure usage of Sass functions
	ret.functionCalls = {};
	let functionCallRegex = new RegExp(`(?<![-.\\w])(${SassFunctions.join("|").replace(".", "\\.")})\\(`, "gi");
	scss.replace(functionCallRegex, ($0, name) => {
		ret.functionCalls[name] = (ret.functionCalls[name] || 0) + 1;
	});
	ret.functionCalls = sortObject(ret.functionCalls);

	// Conditionals
	ret.ifs = [];
	scss.replace(/@(?:(else )?if\s+?(.+?)|@else)(?=\s*\{)/g, ($0, elseIf, test) => {
		if ($0 === "@else") {
			// Else for previous condition
			let obj = ret.ifs.pop();
			console.log(ret.ifs, obj);
			obj.hasElse = true;
			ret.ifs.push(obj);
		}
		else if (elseIf) {
			// Else if for previous condition
			let obj = ret.ifs.pop();
			obj.elseIfs = obj.elseIfs || [];
			obj.elseIfs.push(test);
			ret.ifs.push(obj);
		}
		else {
			// New conditional
			ret.ifs.push({test});
		}
	});

	// @each, @for, @while Loops
	ret.eaches = {};
	scss.replace(/@each\s+(.+ in .+)(?=\s*\{)/g, ($0, args) => {
		ret.eaches[args] = (ret.eaches[args] || 0) + 1;
	});

	ret.fors = {};
	// console.log("@for", scss);
	scss.replace(/@for\s+(.+)(?=\s*\{)/g, ($0, args) => {
		ret.fors[args] = (ret.fors[args] || 0) + 1;
	});

	ret.whiles = {};
	scss.replace(/@while\s+(.+)(?=\s*\{)/g, ($0, args) => {
		ret.whiles[args] = (ret.whiles[args] || 0) + 1;
	});

	// @extend
	ret.extends = {};
	scss.replace(/@extend\s*(.+)(?=\s*(?:[;}]|$))/g, ($0, selector) => {
		ret.extends[selector] = (ret.extends[selector] || 0) + 1;
	});

	// @error
	ret.errors = scss.match(/@error (.+)/g)?.map(e => e.slice(7));

	// CSS variables that are set with Sass variables
	// Note that this will fail on multiline values (it will return the first line only)
	ret.variablesCombined = {value: {}, name: {}};
	scss.replace(/(?<=^|\s)--([\w-]+):\s*(.*#\{.+\}.*)\s*$/gm, ($0, name, value) => {
		ret.variablesCombined.value["--" + name] = value;
	});
	scss.replace(/(?<=^|\s)--([\w-]*#\{.+?\}[\w-]*):\s*(.+?)(?=;|$)/gm, ($0, name, value) => {
		ret.variablesCombined.name["--" + name] = value;
	});

	// Heuristic for nesting &
	ret.nested = {
		"descendant": scss.match(/&\s+(?=[\w[.:#])/g)?.length,
		">": scss.match(/&\s*(?=>)/g)?.length,
		"+": scss.match(/&\s*(?=\+)/g)?.length,
		"~": scss.match(/&\s*(?=~)/g)?.length,
		"lone": scss.match(/&\s*(?=[,{]|$})/g)?.length,
		"pseudo-element": scss.match(/&::/g)?.length,
		"pseudo-class": scss.match(/&:(?!:)/g)?.length,
		"id": scss.match(/&#\w+/g)?.length,
		"class": scss.match(/&\.\w+/g)?.length,
		"attr": scss.match(/&\[\w+/g)?.length,
	};
}

let results = (async () => {

const results = {};
const $$ = s => [...document.querySelectorAll(s)];
const sourcemapRegex = /\/\*[#@] sourceMappingURL=(.+?) \*\//;

let stylesheets = $WPT_BODIES.filter(request => request.type == "Stylesheet")
	.map(file => {
		return {url: file.url, body: file.response_body};
	});

results.stylesheets = {
	remote: stylesheets.length
};

stylesheets.push(...$$("style").map(s => {
	return {
		url: location,
		body: s.textContent
	}
}));

results.stylesheets.inline = stylesheets.length - results.stylesheets.remote;

let sourcemapURLs = stylesheets.map(o => {
	if (o) {
		let url = o.body.match(sourcemapRegex)?.[1];

		if (url) {
			// Source map URL is relative to stylesheet URL
			return new URL(url, o.url);
		}
	}
}).filter(url => !!url);

results.sourcemaps = {
	count: sourcemapURLs.length,
	ext: {}
};

if (sourcemapURLs.length === 0) {
	return results;
}

// Assumption: Either all sources are SCSS or none.
let scss = await Promise.all(sourcemapURLs.map(async url => {
	try {
		var response = await fetch(url);
		var json = await response.json();
	}
	catch (e) {
		return;
	}

	let sources = json.sources;
	let base = json.sourceRoot? new URL(json.sourceRoot, url) : url;
	let scss = 0;

	sources = sources.map(s => {
		let url = new URL(s, base);
		let ext = url.pathname.match(/\.(\w+)$/)?.[1];

		if (ext) {
			results.sourcemaps.ext[ext] = (results.sourcemaps.ext[ext] || 0) + 1;

			if (ext === "scss") {
				scss++;
			}
		}

		return url;
	});

	if (scss > 0) {
		if (json.sourcesContent) {
			// Source is already here, no more requests needed, yay!
			return json.sourcesContent;
		}

		let code = await Promise.all(sources.map(async s => {
			let response = await fetch(s);
			let text = response.ok? await response.text() : "";
			return text;
		}));

		return code.join("\n");
	}
}));

scss = scss.filter(s => !!s).join("\n");

results.scss = {
	size: scss.length,
	stats: {}
};

analyzeSCSS(scss, results.scss.stats)

return results;

})();

// results.then(r => console.log(JSON.stringify(r, null, "\t")));
return results.then(r => JSON.stringify(r));
