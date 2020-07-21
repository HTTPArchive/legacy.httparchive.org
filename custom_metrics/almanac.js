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

// Sanitize the `attributes` property.
function getNodeAttributes(node) {
  // Inspired by dequelabs/axe-core.
  if (node.attributes instanceof NamedNodeMap) {
    return node.attributes;
  }
  return node.cloneNode(false).attributes;
}

// Map nodes to their attributes,
function parseNodes(nodes) {
  var parsedNodes = [];
  if (nodes) {
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var attributes = Object.values(getNodeAttributes(node));
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
  // Looks at links and identifies internal, external or hashed as well as rel attributes and if a link is image only  
  'seo-anchor-elements': (() => {
    // Used by: SEO
    // metric 10.10, 10.11,
    var nodes = document.getElementsByTagName('a');
    var link = document.createElement('a');

    var internal = 0; // metric 10.10
    var external = 0; // metric 10.10
    var hash = 0;
    var navigateHash = 0; // metric 10.11
    var earlyHash = 0; // metric 09.10
    
    var nofollow = 0;
    var ugc = 0;
    var sponsored = 0;
    var imageLink = 0;

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
                  if (i < 3) {
                    earlyHash++;
                  }
                } else {
                  navigateHash++;
                }
              } catch (e) {}
            }
          } else if (document.location.hostname !== link.hostname) {
            external++;
          }
          
          // Checking rel attribute values 
          // https://support.google.com/webmasters/answer/96569?hl=en
          if (node.rel) {
              node.rel.split(" ").forEach(n1 => {
                  n1.split(",").forEach(n => {
                      switch (n.toLowerCase().trim()) {
                          case "nofollow":
                              nofollow++;
                              break;
                          case "ugc":
                              ugc++;
                              break;
                          case "sponsored":
                              sponsored++;
                              break;
                      }
                  });
              });
          }

          // see if it is an image link
          // no visible text
          let noText = node.innerText.trim().length === 0;
          let hasImage = node.querySelector('img') !== null;

          if (noText) {
              if (hasImage) {
                  imageLink++;
              }
              else {
                  // invisible link? 
              }
          }
        }
      }
    }

    return { internal, external, hash, navigateHash, earlyHash, nofollow, ugc, sponsored, imageLink };
  })(),
  // Extract the real title tag contents  
  // Used by: SEO
  'title': Array.from(document.querySelectorAll('head title')).map(e => {return {"text": e.innerText}}),
  // Get the html lang attribute if present. Was previously done via SQL which only captured the first two characts of the value (country code)
  // Used by: SEO
  'html-lang': document.querySelector('html')?.getAttribute('lang'),
  // visible word count
  // Used by: SEO
  'visible-words': document.body?.innerText?.match(/\S+/g)?.length, // \S+ matches none whitespace, which would be a word
  // content information including visible words and number of headings
  'heading': (() => {
      // Used by: SEO
      let result = {};

       var h1Array = Array.from(document.querySelectorAll('h1'));

      result.h1 = h1Array.map(e => {return {"text": e.innerText}});

      // do we need this?
      result.h1Count = h1Array.length;
      result.h2Count = document.querySelectorAll('h2').length;
      result.h3Count = document.querySelectorAll('h3').length;
      result.h4Count = document.querySelectorAll('h4').length;

      
      return result; 
  })(),

  // data on img tags including alt, loading, width & height attribute use  
  'image': (() => {
      // Used by: SEO
      var nodes = document.querySelectorAll('img');

      let result = {
          images: 0,
          alt: {
              missing: 0,
              blank: 0,
              present: 0
          },
          loading: {
              auto: 0,
              lazy: 0,
              eager: 0,
              invalid: 0,
              missing: 0,
              blank: 0
          },
          dimensions: {
              missingWidth: 0,
              missingHeight: 0
          }
      };

      nodes.forEach(node => {
          result.images++;
          if (node.hasAttribute("alt")) {
              if (node.getAttribute("alt").trim().length > 0) {
                  result.alt.present++;
              }
              else {
                  result.alt.blank++;
              }
          }
          else {
              result.alt.missing++;
          }

          // https://web.dev/native-lazy-loading/
          if (node.hasAttribute("loading")) {
              let val = node.getAttribute("loading").trim().toLowerCase();

              switch (val) {
                  case "auto":
                      result.loading.auto++;
                      break;
                  case "lazy":
                      result.loading.lazy++;
                      break;
                  case "eager":
                      result.loading.eager++;
                      break;
                  case "":
                      result.loading.blank++;
                      break;
                  default:
                      result.loading.invalid++;
                      break;
              }
          }
          else {
              result.loading.missing++;
          }

          if (!node.hasAttribute("width")) result.dimensions.missingWidth++;
          if (!node.hasAttribute("height")) result.dimensions.missingHeight++;
      });

      return result;
  })(),
  // data-nosnippet use 
  'data-nosnippet': (() => {
      // Used by: SEO
      // https://support.google.com/webmasters/answer/79812?hl=en
      // https://developers.google.com/search/reference/robots_meta_tag
      var validNodes = document.querySelectorAll('span[data-nosnippet], div[data-nosnippet], section[data-nosnippet]');
      var allNodes = document.querySelectorAll('[data-nosnippet]');
      return { valid: validNodes.length, wrongTagType: allNodes.length - validNodes.length};
  })(),
  // Extracts headings used and counts the words, to flag thin content pages
  'seo-titles': (() => {
    // metric 10.9    
    // SEO: I'm not sure we will still use this. The content property should return more useful heading info. Maybe the word coutn is of value?
    
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
        var nodeText = node.textContent.trim().replace(/\s+/g, ' '); // shrink spaces down to one
        // splitting on a whitespace, won't work for e.g. Chinese
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
    // SEO: I'm not sure we will still use this. The content property should return more accurate word counts and is far simpler.
    
    function analyseTextNode(node) {
      // remove extra whitespace
      var nodeText = node.textContent.trim().replace(/\s+/g, ' '); // shrink spaces down to one
      // splitting on a whitespace, won't work for e.g. Chinese
      var nodeWordsCount = nodeText.split(' ').length;

      if (nodeWordsCount > 3) { // ignores nodes with 3 or less words?
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

    // Extract the text of the H1 tag 
  'h1-text': (() => {
    // We return only the text of the first H1. 
    var h1_text = document.querySelectorAll('h1')[0]?.textContent ?? 'h1 is missing';
    
    return h1_text;
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
  '09.27': (() => {
    // Returns a JSON array of nodes with a tabindex and their key/value attributes.
    // We acknowledge that attribute selectors are expensive to query.
    var nodes = document.querySelectorAll('body [tabindex]');
    var parsedNodes = parseNodes(nodes);

    return parsedNodes;
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
  })(),
  'amp-plugin': (() => {
    // Gets metadata about the AMP plugin, if present.
    // Used by 14.2, 14.3, 14.4.
    try {
      var metadata = document.querySelector('meta[name=generator][content^="AMP Plugin"]');
      if (metadata) {
        return metadata.getAttribute('content');
      }
    } catch (e) {
      return null;
    }
  })(),
  //  check if there is any picture tag containing an img tag
  'has_picture_img': document.querySelectorAll('picture img').length > 0
});
