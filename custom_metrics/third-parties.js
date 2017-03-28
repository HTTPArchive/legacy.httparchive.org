/**
 * Detect the presence of third party libraries.
 *
 * Look for common library aliases on the global scope.
 * If available, detect libraries' versions.
 *
 * Outputs JSON-serialized list of library-version pairs.
 *     e.g.: `["a@1.0","b","c@2.2"]`
 */
var thirdParties = [];
var name, version;

function addThirdParty(name, version) {
	if (!name) {
		return;
	}

	name += '@' + (version || 'null');

	thirdParties.push(name);
}

// jQuery
// https://github.com/jquery/jquery/blob/c1c549793a8772107e128d21f8a8f0c3fdf0f027/src/core.js#L53
var jQuery = window.jQuery || window.$ || window.$jq || window.$j;
name = jQuery && jQuery.fn && 'jQuery';
version = name && jQuery.fn.jquery
addThirdParty(name, version);

// TODO(rviscomi): Add more libraries...

return JSON.stringify(thirdParties);
