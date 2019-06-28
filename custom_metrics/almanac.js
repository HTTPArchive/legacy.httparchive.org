//[almanac]
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

function parseNodes(nodes) {
  var parsedNodes = [];
  if (nodes) {
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var attributes = Object.values(node.attributes);
      var el = {};

      el.tagName = node.tagName.toLowerCase(); // for reference
      for (var n = 0, len2 = attributes.length; n < len2; n++) {
        var attribute = attributes[n];
        el[attribute.name.toLowerCase()] = attribute.value;
      }

      parsedNodes.push(el);
    }
  }
  return parsedNodes;
}

return JSON.stringify({
  // Wether the page contains <script type=module>.
  '01.12': document.querySelector('script[type=module]') ? 1 : 0,
  // Wether the page contains <script nomodule>.
  '01.13': document.querySelector('script[nomodule]') ? 1 : 0,
  'link-nodes': (() => {
    // Returns a JSON array of link nodes and their key/value attributes.
    // Used by 01.14, 01.15, 01.16, 10.6,  06.46, 12.18
    var nodes = document.querySelectorAll('head link');
    var linkNodes = parseNodes(nodes);

    return linkNodes;
  })(),
  'priority-hints': (() => {
    // Returns a JSON array of prioritized nodes and their key/value attributes.
    // Used by 19.8, 19.9, and 19.10.
    var nodes = document.querySelectorAll('link[importance], img[importance], script[importance], iframe[importance]');
    var parsedNodes = parseNodes(nodes);

    return parsedNodes;
  })(),
  'meta-nodes': (() => {
    // Returns a JSON array of meta nodes and their key/value attributes.
    // Used by 10.6, 10.7 (potential: 09.29, 12.5, 04.5)
    var nodes = document.querySelectorAll('head meta');
    var metaNodes = parseNodes(nodes);

    return metaNodes;
  })(),
  // Extract schema.org elements and finds all @context and @type usage
  '10.5': (() => {
    function nestedLookup(items, depth) {
      var keys = Object.keys(items);

      // skip if nested depth > 5
      if (depth > 5) {
        return;
      }

      for (var i = 0, len = keys.length; i < len; i++) {
        var item = items[keys[i]];
        // if array or object, dive into it
        if (item instanceof Object || item instanceof Array) {
          nestedLookup(item, depth++);
        }
      }
      if (items['@type']) {
        if (items['@context']) {
          link.href = items['@context'] + '/' + items['@type'];
          schemaElements[link.hostname + link.pathname] = true;
        } else {
          schemaElements[items['@type']] = true;
        }
      }
    }

    var nodes = document.querySelectorAll('[itemtype], script[type=\'application/ld+json\']');
    var link = document.createElement('a');
    var schemaElements = {};

    if (nodes) {
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];
        var item = node.getAttribute('itemtype');

        if (item) {
          // microdata
          link.href = node.getAttribute('itemtype');
          schemaElements[link.hostname + link.pathname] = true;
        } else if (node.tagName == 'SCRIPT') {
          // json+ld
          try {
            var content = JSON.parse(node.textContent);
            var contentLoop = [];
            if (content instanceof Object || content instanceof Array) {
              // nested lookup
              nestedLookup(content, 0);
            }
          } catch (e) {}
        }
      }
    }
    return Object.keys(schemaElements);
  })(),
  // Looks at links and identifies internal, external or hashed
  'seo-anchor-elements': (() => {
    // metric 10.10, 10.11,
    var nodes = document.getElementsByTagName('a');
    var link = document.createElement('a');

    var internal = 0; // metric 10.10
    var external = 0; // metric 10.10
    var hash = 0;
    var navigateHash = 0; // metric 10.11

    if (nodes) {
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];

        // our local parser trick
        if (node.href) {
          link.href = node.href;

          if (document.location.hostname === link.hostname) {
            internal++;
            if (document.location.pathname === link.pathname && link.hash.length > 1) {
              // check if hash matches an element in the DOM (scroll to)
              try {
                var element = document.querySelector(link.hash);
                if (element) {
                  hash++;
                } else {
                  navigateHash++;
                }
              } catch (e) {}
            }
          } else if (document.location.hostname !== link.hostname) {
            external++;
          }
        }
      }
    }

    return { internal, external, hash, navigateHash };
  })(),
  // Extracts titles used and counts the words, to flag thin content pages
  'seo-titles': (() => {
    // metric 10.9
    var nodes = document.querySelectorAll('h1, h2, h3, h4');
    var titleWords = -1;
    var titleElements = -1;

    if (nodes) {
      titleWords = 0;
      titleElements = 0;

      // analyse each title node
      for (var i = 0, len = nodes.length; i < len; i++) {
        var node = nodes[i];
        // remove extra whitespace
        var nodeText = node.textContent.trim().replace(/\s+/g, ' ');
        var nodeWordsCount = nodeText.split(' ').length;

        if (nodeWordsCount > 0) {
          titleWords += nodeWordsCount;
          titleElements++;
        }
      }
    }
    return { titleWords, titleElements };
  })(),
  // Extracts words on the page to flag thin content pages
  'seo-words': (() => {
    // metric 10.9
    function analyseTextNode(node) {
      // remove extra whitespace
      var nodeText = node.textContent.trim().replace(/\s+/g, ' ');
      // splitting on a whitespace, won't work for e.g. Chinese
      var nodeWordsCount = nodeText.split(' ').length;

      if (nodeWordsCount > 3) {
        // update counts
        wordsCount += nodeWordsCount;
        wordElements++;
      }
    }

    var body = document.body;
    var wordsCount = -1;
    var wordElements = -1;
    if (body) {
      wordsCount = 0;
      wordElements = 0;
      var n,
        nodes = [],
        walk = document.createTreeWalker(
          body,
          NodeFilter.SHOW_ALL,
          {
            acceptNode: function(node) {
              if (node.nodeName === 'STYLE' || node.nodeName === 'SCRIPT') {
                return NodeFilter.FILTER_REJECT;
              }

              // nodeType === 3 are Node.TEXT_NODE
              if (node.nodeType !== 3) {
                return NodeFilter.FILTER_SKIP;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          },
          false
        );
      while ((n = walk.nextNode())) analyseTextNode(n);
    }
    return { wordsCount, wordElements };
  })(),
  // Parse <input> elements
  'input-elements': (() => {
    // Used by  12.12, 12.14
    var nodes = document.querySelectorAll('input, select');
    var inputNodes = parseNodes(nodes);

    return inputNodes;
  })(),
  // Find first child of <head>
  // Whether the first child of <head> is a Google Fonts <link>
  '06.47': (() => {
    var head = document.querySelector('head');
    if (head) {
      var headChild = head.firstElementChild;
      if (headChild && headChild.tagName == 'LINK' && /fonts.googleapis.com/i.test(headChild.getAttribute('href'))) {
        return 1;
      }
    }
    return 0;
  })(),
  '08.39': (() => {
    // Counts the number of link/script elements with the subresource integrity attribute.
    return {
      'link': document.querySelectorAll('link[integrity]').length,
      'script': document.querySelectorAll('script[integrity]').length
    };
  })(),
  '12.11': (() => {
    // Counts the links or buttons only containing an icon.
    var clickables = document.querySelectorAll('a, button');
    return Array.from(clickables).reduce((n, clickable) => {
      // Clickables containing SVG are assumed to be icons.
      if (clickable.firstElementChild && clickable.firstElementChild.tagName == 'SVG') {
        return n + 1;
      }
      // Clickables containing 1-char text are assumed to be icons.
      // Note that this fails spectacularly for complex unicode points.
      // See https://blog.jonnew.com/posts/poo-dot-length-equals-two.
      if (clickable.textContent.trim().length == 1) {
        return n + 1;
      }
      return n;
    }, 0);
  })()
});
