function analyzeVariables() {

const PREFIX = "almanac-var2020-";

// Selector to find elements that are relevant to the graph
const selector = `.${PREFIX}element, [style*="--"]`;

// Extract a list of custom properties set by a value
function extractValueProperties(value) {
	// https://drafts.csswg.org/css-syntax-3/#ident-token-diagram
	let ret = value.match(/var\(--[-\w\u{0080}-\u{FFFF}]+(?=[,)])/gui)?.map(p => p.slice(4));

	if (ret) {
		// Drop duplicates
		return [...new Set(ret)];
	}
}

let visited = new Set();

// Recursively walk a CSSStyleRule or CSSStyleDeclaration
function walkRule(rule, ret) {
	if (!rule || visited.has(rule)) {
		return;
	}

	visited.add(rule);

	let style, selector;

	if (rule instanceof CSSStyleRule && rule.style) {
		style = rule.style;
		selector = rule.selectorText;
	}
	else if (rule instanceof CSSStyleDeclaration) {
		style = rule;
		selector = "";
	}

	if (style) {
		let condition;
		// mirror properties to add. We add them afterwards, so we don't pointlessly traverse them
		let additions = {};

		for (let property of style) {
			let value = style.getPropertyValue(property);

			let containsRef = value.indexOf("var(--") > -1;
			let setsVar = property.indexOf("--") === 0 && property.indexOf("--" + PREFIX) === -1;

			if (containsRef || setsVar) {
				if (!condition && rule.parentRule) {
					condition = [];
					let r = rule;

					while (r.parentRule?.conditionText) {
						r = r.parentRule;
						condition.push({
							type: r instanceof CSSMediaRule? "media" : "supports",
							test: r.conditionText
						});
					}
				}

				if (containsRef) {
					// Set mirror property so we can find it in the computed style
					additions["--" + PREFIX + property] = value.replace(/var\(--/g, PREFIX + "$&");

					let properties = extractValueProperties(value);

					for (let prop of properties) {
						let info = ret[prop] = ret[prop] || {get: [], set: []};
						info.get.push({ usedIn: property, value, selector, condition });
					}
				}

				if (setsVar) {
					let info = ret[property] = ret[property] || {get: [], set: []};
					info.set.push({ value, selector, condition });
				}

				// Add class so we can find these later
				if (selector) {
					for (let el of document.querySelectorAll(selector)) {
						el.classList.add(`${PREFIX}element`);
					}
				}
			}
		}

		// Now that we're done, add the mirror properties
		for (let property in additions) {
			style.setProperty(property, additions[property]);
		}
	}

	if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
		// rules with child rules, e.g. @media, @supports
		for (let r of rule.cssRules) {
			walkRule(r, ret);
		}
	}
}

// Return a subset of the DOM tree that contains variable reads or writes
function buildGraph() {
	// Elements that contain variable reads or writes.
	let elements = new Set(document.querySelectorAll(selector));
	let map = new Map(); // keep pointers to object for each element
	let ret = [];

	for (let element of elements) {
		map.set(element, {element, children: []});
	}

	for (let element of elements) {
		let ancestor = element.parentNode.closest?.(selector);
		let obj = map.get(element);

		if (ancestor) {
			let o = map.get(ancestor);
			o.children.push(obj)
		}
		else {
			// Top-level
			ret.push(obj);
		}

		let cs = element.computedStyleMap();
		let parentCS = element.parentNode.computedStyleMap?.();
		let vars = extractVars(cs, parentCS);

		if (Object.keys(vars).length > 0) {
			obj.declarations = vars;
		}
	}

	return ret;
}

// Extract custom property declarations from a computed style map
// The schema of the returned object is:
// {get: {--var1: [{property, value, computedValue}]}, set: {--var2: {value, type}}}
function extractVars(cs, parentCS) {
	let ret = {};
	let norefs = {};

	for (let [property, [originalValue]] of cs) {
		// Do references first
		if (property.indexOf("--") === 0) {
			let value = originalValue + "";

			// Skip inherited values
			if (parentCS && (parentCS.get(property) + "" === value + "")) {
				continue; // most likely inherited
			}

			if (property.indexOf("--" + PREFIX) === 0) {
				// Usage
				let originalProperty = property.replace("--" + PREFIX, "");

				value = value.replace(RegExp(PREFIX + "var\\(--", "g"), "var(--");
				let properties = extractValueProperties(value);
				let computed = cs.get(originalProperty) + "";

				ret[originalProperty] = {
					value,
					references: properties
				}

				if (computed !== value) {
					ret[originalProperty].computed = computed;
				}
			}
			else {
				// Definition
				norefs[property] = {value};

				if (originalValue + "" !== value) {
					norefs[property].computed = originalValue + "";
				}

				// If value is of another type, we have Houdini P&V usage!
				if (!(originalValue instanceof CSSUnparsedValue)) {
					norefs[property].type = Object.prototype.toString.call(originalValue).slice(8, -1);
				}
			}
		}
	}

	// Merge static with ret
	for (let property in norefs) {
		if (!(property in ret)) {
			ret[property] = norefs[property];
		}
	}

	return ret;
}

let summary = {};

// Walk through stylesheet and add custom properties for every declaration that uses var()
// This way we can retrieve them in the computed styles and build a dependency graph.
// Otherwise, they get resolved before they hit the computed style.
for (let stylesheet of document.styleSheets) {
	try {
		var rules = stylesheet.cssRules;
	}
	catch (e) {}

	if (rules) {
		for (let rule of rules) {
			walkRule(rule, summary);
		}
	}
}

// Do the same thing with inline styles
for (let element of document.querySelectorAll('[style*="--"]')) {
	walkRule(element.style, summary);
}

let computed = buildGraph();

// Cleanup
for (let el of document.querySelectorAll(`.${PREFIX}element`)) {
	el.classList.remove(`${PREFIX}element`);
}

return {summary, computed};

};

function serialize(data, separator) {
	return JSON.stringify(data, (key, value) => {
		if (value instanceof HTMLElement) {
			let str = value.tagName;

			if (value.classList.length > 0) {
				str += "." + [...value.classList].join(".")
			}

			if (value.id) {
				str += "#" + value.id;
			}

			return str;
		}

		// remove empty arrays
		if (Array.isArray(value) && value.length === 0) {
			return;
		}

		return value;
	}, separator);
}

return analyzeVariables();
