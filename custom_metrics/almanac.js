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

function parseNode(node) {
  var attributes = Object.values(getNodeAttributes(node));
  var el = {};

  el.tagName = node.tagName.toLowerCase(); // for reference
  for (var n = 0, len2 = attributes.length; n < len2; n++) {
    var attribute = attributes[n];
    if (!attribute.name) {
      continue;
    }

    el[attribute.name.toLowerCase()] = attribute.value;
  }

  return el;
}

// Map nodes to their attributes,
function parseNodes(nodes) {
  var parsedNodes = [];
  if (nodes) {
    for (var i = 0, len = nodes.length; i < len; i++) {
      var node = nodes[i];
      var el = parseNode(node);
      parsedNodes.push(el);
    }
  }
  return parsedNodes;
}

/**
 * Executes a function on the node and all of its children
 *
 * By default it only executes the function if the node is an element.
 * Disable this to run the function on a node of any type (e.g., text nodes)
 */
function walkNodes(root_node, fun, only_elements = true) {
  let walker;
  if (only_elements) {
    walker = document.createTreeWalker(root_node, NodeFilter.SHOW_ELEMENT);
  } else {
    walker = document.createTreeWalker(root_node);
  }

  let current_node = walker.currentNode;
  while (current_node) {
    fun(current_node);
    current_node = walker.nextNode();
  }
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
    var earlyHash = 0; // metric 09.10

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
        }
      }
    }

    return { internal, external, hash, navigateHash, earlyHash };
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
  '09.27': (() => {
    // Returns a JSON array of nodes with a tabindex and their key/value attributes.
    // We acknowledge that attribute selectors are expensive to query.
    var nodes = document.querySelectorAll('body [tabindex]');
    var parsedNodes = parseNodes(nodes);

    return parsedNodes;
  })(),
  // Counts the links or buttons only containing an icon.
  'icon_only_clickables': (() => {
    function containsAnSvg(element) {
      var children = Array.from(element.childNodes);
      return !!children.find((child) => {
        if (child.tagName && child.tagName.toLowerCase() === 'svg') {
          return true;
        }

        if (child.childNodes.length) {
          return containsAnSvg(child);
        }

        return false;
      });
    }

    var clickables = document.querySelectorAll('a, button');
    return Array.from(clickables).reduce((n, clickable) => {
      var visible_text_length = clickable.textContent.trim().length;

      // Clickables containing 1-char text are assumed to be icons.
      // Note that this fails spectacularly for complex unicode points.
      // See https://blog.jonnew.com/posts/poo-dot-length-equals-two.
      if (visible_text_length == 1) {
        return n + 1;
      }

      if (containsAnSvg(clickable)) {
        // The icon in this case is an svg, so any other text is assumed to be a label
        if (visible_text_length >= 1) {
          return n;
        }

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

  // Previously for 04_04.sql in 2019
  'inline_svg_stats': (() => {
    const svg_elements = [...document.querySelectorAll('svg')];

    return {
      total: svg_elements.length,
      content_lengths: svg_elements.map(svg => svg.outerHTML.length),
      props: parseNodes(svg_elements),
    };
  })(),

  // Various stats of img, source and picture elements
  'images': (() => {
    const pictures = document.querySelectorAll('picture');
    const imgs = [...document.querySelectorAll('img')];
    const sources = document.querySelectorAll('source');
    const pictures_with_img = document.querySelectorAll('picture img');

    const images_with_srcset = document.querySelectorAll('img[srcset], source[srcset]');
    const images_with_sizes = [...document.querySelectorAll('img[sizes], source[sizes]')];
    const images_using_loading_prop = [...document.querySelectorAll('img[loading], source[loading]')];

    // NOTE: -1 is used to represent images with no alt tag at all. Empty alt tags have a value of 0
    const alt_tag_lengths = imgs.map(img => {
      if (!img.hasAttribute('alt')) {
        return -1;
      }

      // alt=" " is less correct but comparable to alt="" so we use trim
      // Also remove duplicate spaces to get a feel for how long alt tags really are
      return img.alt.trim().replace(/\s+/g, ' ').length;
    });

    return {
      total_pictures: pictures.length,
      total_img: imgs.length,
      total_sources: sources.length,

      total_with_srcset: images_with_srcset.length,
      total_with_sizes: images_with_sizes.length,
      total_pictures_with_img: pictures_with_img.length,

      // Values specific properties. Cleaned and trimmed to make processing easier
      sizes_values: images_with_sizes.map(img => {
        const value = img.getAttribute('sizes') || '';
        return value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      }),
      loading_values: images_using_loading_prop.map(img => {
        const value = img.getAttribute('loading') || '';
        return value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      }),
      alt_tag_lengths: alt_tag_lengths,

      // NOTE: props starting with __ are not actual properties. They were added by this script
      picture_props: parseNodes(pictures),
      img_props: imgs.map(img => {
        const props = parseNode(img);
        props.__natural_width = img.naturalWidth;
        props.__natural_height = img.naturalHeight;
        props.__width = img.width;
        props.__height = img.height;

        return props;
      }),
      source_props: parseNodes(sources),
    };
  })(),

  'videos': (() => {
    const videos = document.querySelectorAll('video');

    return {
      total: videos.length,
      props: parseNodes(videos),
    };
  })(),

  'scripts': (() => {
    return {
      total: document.scripts.length,
      props: parseNodes(document.scripts),
    };
  })(),

  'nodes_using_role': (() => {
    const nodes_with_role = [...document.querySelectorAll('[role]')];

    /**
     * 1. Build an object with each key being a unique value of `role` and the value being how often this role occurred
     * 2. Make a list of unique role values
     */
    const unique_values = new Set();
    const role_values_and_count = {};
    for (const node of nodes_with_role) {
      const role = node.getAttribute('role').toLowerCase();
      unique_values.add(role);

      if (!role_values_and_count[role]) {
        role_values_and_count[role] = 1;
        continue;
      }

      role_values_and_count[role]++;
    }

    return {
      total: nodes_with_role.length,
      values_and_count: role_values_and_count,
      unique_values: [...unique_values],
    };
  })(),

  'total_nodes_with_duplicate_ids': (() => {
    const nodes_with_id = [...document.querySelectorAll('[id]')];
    const id_count_map = new Map();
    for (const node of nodes_with_id) {
      const count = id_count_map.get(node.id) || 0;
      id_count_map.set(node.id, count + 1);
    }

    let total_duplicates = 0;
    for (const count of id_count_map.values()) {
      if (count > 1) {
        // Subtract one because the first div to have this ID is not a duplicate
        total_duplicates += count - 1;
      }
    }

    return total_duplicates;
  })(),

  /**
   * The 'h' is stripped to create a numeric array.
   * E.g. h1 > h2 > h3 > h3 => [1, 2, 3, 3, ]
   */
  'headings_order': (() => {
    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    const levels = [];
    for (const heading of headings) {
      const level = parseInt(heading.tagName.replace('H', ''), 10);
      if (!isNaN(level)) {
        levels.push(level);
      }
    }

    return levels;
  })(),

  'shortcuts_stats': (() => {
    const aria_shortcut_nodes = [...document.querySelectorAll('[aria-keyshortcuts]')];
    const accesskey_nodes = [...document.querySelectorAll('[accesskey]')];

    return {
      total_with_aria_shortcut: aria_shortcut_nodes.length,
      total_with_accesskey: accesskey_nodes.length,

      // Purposely left these as potentially duplicated fields so we can analyze if the same value is used more than once
      aria_shortcut_values: aria_shortcut_nodes.map(node => node.getAttribute('aria-keyshortcuts')),
      accesskey_values: accesskey_nodes.map(node => node.getAttribute('accesskey')),
    };
  })(),

  'nodes_using_aria': (() => {
    // Example usage: Process all elements on the page
    const aria_nodes = [];
    walkNodes(document.documentElement, (node) => {
      const attributes = node.getAttributeNames();
      if (attributes.length <= 0) {
        return;
      }

      let has_aria = false;
      for (const attribute_name of attributes) {
        if (attribute_name.toLowerCase().indexOf('aria-') === 0) {
          // This node has aria, so we'll store all of its attributes and move on to the next node now
          aria_nodes.push(parseNode(node));
          return;
        }
      }

      // The node didn't have aria so we simply do nothing and move on to the next node
    });

    return aria_nodes;
  })(),

  // NOTE: This will not pick up all of the attributes on scripts
  'attributes_used_on_elements': (() => {
    // Example usage: Process all elements on the page
    const unique_values = new Set();
    const attributes_and_count = {};
    walkNodes(document.documentElement, (node) => {
      const attribute_names = node.getAttributeNames();
      if (attribute_names.length <= 0) {
        return;
      }

      // Count how often each of these attributes shows up
      for (const name of attribute_names) {
        unique_values.add(name);

        if (!attributes_and_count[name]) {
          attributes_and_count[name] = 1;
          continue;
        }

        attributes_and_count[name]++;
      }
    });

    return {
      // How often each of these values show up
      values_and_count: attributes_and_count,
      unique_values: [...unique_values],
    };
  })(),

  'body_node': (() => {
    return parseNode(document.body);
  })(),

  'html_node': (() => {
    return parseNode(document.documentElement);
  })(),

  'document_title': (() => {
    return {
      value: document.title,
      length: document.title.length
    };
  })(),

  'length_of_h1s': (() => {
    return [...document.querySelectorAll('h1')].map(node => node.innerText.length);
  })(),
});
