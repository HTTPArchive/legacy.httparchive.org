//[almanac]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
//
// Add a new key/value pair to the return object below.
//
// 1. The key should be a unique identifier for the metric, if possible, like it's metric ID (eg '01.12').
// 1a. If the value is used by multiple metrics, the key should be named according to what it's measuring (eg 'link-nodes').
// 2. The value must evaluate to a simple type like int or string. For complex types (array, obj) use `JSON.stringify`.
// 2a. If the value requires more than one line of code, evaluate it in an IIFE, eg `(() => { ... })()`. See `link-nodes`.
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

return {
  // Wether the page contains <script type=module>.
  '01.12': document.querySelector('script[type=module]') ? 1 : 0,
  // Wether the page contains <script nomodule>.
  '01.13': document.querySelector('script[nomodule]') ? 1 : 0,
  'link-nodes': (() => {
    // Returns a JSON array of link nodes and their key/value attributes.
    // Used by 01.14, 01.15, 01.16...
    var nodes = document.querySelectorAll('head link');
    var linkNodes = [];

    if (nodes) {
        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            var attributes = Object.values(node.attributes);
            var el = {};

            for (var n = 0, len2 = attributes.length; n < len2; n++) {
                var attribute = attributes[n];
                el[attribute.name.toLowerCase()] = attribute.value;
            }

            linkNodes.push(el);
        }
    }
    
    return JSON.stringify(linkNodes);
  })()
};
