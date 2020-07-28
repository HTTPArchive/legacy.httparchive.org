//[almanac-css]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
//
// Add a new key/value pair to the return object below.
//
// 1. The key should be a unique identifier for the metric, if possible, like it's metric ID (eg '01.12').
// 1a. If the value is used by multiple metrics, the key should be named according to what it's measuring (eg 'link-nodes').
// 2. If the value requires more than one line of code, evaluate it in an IIFE, eg `(() => { ... })()`. See `link-nodes`.
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

return JSON.stringify({
    'has_cssinjs_styled_components': !!(document.querySelector('style[data-styled]').length || document.querySelectorAll('style[data-styled-components]').length),
    'has_cssinjs_radium': !!document.querySelector('[data-radium]').length,
    'has_cssinjs_jss': !!document.querySelector('[data-jss]').length,
    'has_cssinjs_emotion': !!document.querySelector('[data-emotion]').length,
    'has_cssinjs_goober': !!document.getElementById('_goober'),
    'has_cssinjs_merge-styles': !!document.querySelector('[data-merge-styles]')
});
