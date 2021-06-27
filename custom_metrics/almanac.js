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

/**
 * @typedef {Object} ParseNodeOptions
 * @property {boolean} [prop_values_to_remove]
 * @property {boolean} [remove_data_prop_value=true]
 * @property {boolean} [remove_input_value=true] - On input elements, removes the value="" value
 * @property {RegExp[]} [other_prop_values_to_remove] - Array of regex patterns. If any property name matches these, their values are removed
 * @property {Map<RegExp, number>} [prop_to_max_length_map] - Map of regex to max sizes. If any property name matches these, their values will be clamped
 * @property {number} [max_prop_length=-1] - Default max length of a property. -1 turns this feature off
 * @property {RegExp[]} [include_only_prop_list] - An explicit list of props to keep. If this is used, any other properties will be discarded completely
 */

/**
 * @typedef {Object} ParseNodeResponse
 * @property {Object.<string, string>[]} attributes
 * @property {string[]} attribute_names
 */

/**
 * @param {Node} node
 * @param {ParseNodeOptions} options
 * @return {ParseNodeResponse}
 */
function parseNode(node, options = {}) {
  options = Object.assign(
      {},
      {
        remove_data_prop_value: true,
        remove_input_value: true,
        other_prop_values_to_remove: [],

        prop_to_max_length_map: new Map(),
        max_prop_length: -1,

        include_only_prop_list: [],
      },
      options);
  const attributes = Object.values(getNodeAttributes(node));
  const el = {};
  const attribute_names = new Set();
  const input_tag_names = new Set('input', 'select', 'textarea');

  // Copy the array to avoid weird bugs in the future from sharing an array
  const removal_patterns = [...options.other_prop_values_to_remove];
  if (options.remove_data_prop_value) {
    removal_patterns.push(/^data-/);
  }

  el.tagName = node.tagName.toLowerCase(); // for reference
  for (const attribute of attributes) {
    if (!attribute.name) {
      continue;
    }

    // Always add the names of the attributes. These are not filtered
    const attribute_name = attribute.name.toLowerCase();
    attribute_names.add(attribute_name);

    if (options.include_only_prop_list && options.include_only_prop_list.length > 0) {
      // We're using an include only list for props. Throw away everything else
      let found = false;
      for (const pattern of options.include_only_prop_list) {
        if (pattern.test(attribute_name)) {
          found = true;
          break;
        }
      }

      if (!found) {
        continue;
      }
    }

    el[attribute_name] = attribute.value;

    // No processing to do. Exit early
    if (!el[attribute_name] || el[attribute_name].length <= 0) {
      continue;
    }

    if (options.remove_input_value &&
        input_tag_names.has(el.tagName) && attribute_name === 'value') {
      el[attribute_name] = '';
      continue;
    }

    for (const pattern of removal_patterns) {
      if (pattern.test(attribute_name)) {
        el[attribute_name] = '';
        continue;
      }
    }

    // Ensure the value length is kept within bounds
    let matched = false;
    for (const [pattern, max_length] of options.prop_to_max_length_map) {
      if (pattern.test(attribute_name)) {
        el[attribute_name] = el[attribute_name].substr(0, max_length);
        matched = true;
        // We cannot exit early, because future matches might be more specific
      }
    }

    // If there wasn't a rule specified for this property, clamp it to the default max size
    if (!matched && options.max_prop_length > 0) {
      el[attribute_name] = el[attribute_name].substr(0, options.max_prop_length);
    }
  }

  return {
    attributes: el,
    attribute_names: Array.from(attribute_names),
  };
}

/**
 * @typedef {Object} ParseNodesResponse
 * @property {number} total - Total nodes
 * @property {Object.<string, string>[]} nodes - Key value object of all the properties in the node. Filtered by the options passed
 * @property {Object.<string, number>} attribute_usage_count - How often each property was used. This is NOT FILTERED by the options passed
 */

/**
 * Process nodes and their attributes
 * @param {Node[]} nodes
 * @param {ParseNodeOptions} options
 * @returns {ParseNodesResponse}
 */
function parseNodes(nodes, options = {}) {
  if (!nodes) {
    return {
      total: 0,
      attributes: [],
      attribute_usage_count: {},
    };
  }

  const parsed_nodes = [];
  const attribute_usage_count = {};
  const total = nodes.length;
  for (const node of nodes) {
    const result = parseNode(node, options);
    for (const name of result.attribute_names) {
      if (!attribute_usage_count[name]) {
        attribute_usage_count[name] = 1;
        continue;
      }

      attribute_usage_count[name]++;
    }

    parsed_nodes.push(result.attributes);
  }

  return {
    total,
    nodes: parsed_nodes,
    attribute_usage_count,
  };
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
    return parseNodes(nodes);
  })(),
  'priority-hints': (() => {
    // Returns a JSON array of prioritized nodes and their key/value attributes.
    // Used by 19.8, 19.9, and 19.10.
    var nodes = document.querySelectorAll('link[importance], img[importance], script[importance], iframe[importance]');
    return parseNodes(nodes);
  })(),
  'meta-nodes': (() => {
    // Returns a JSON array of meta nodes and their key/value attributes.
    // Used by 10.6, 10.7 (potential: 09.29, 12.5, 04.5)
    var nodes = document.querySelectorAll('head meta');
    return parseNodes(nodes);
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
  'input_elements': (() => {
    var nodes = document.querySelectorAll('input, select');
    var inputNodes = parseNodes(nodes , {
      include_only_prop_list: [
        /^aria-.+$/,
        /^type$/,
        /^id$/,
        /^name$/,
        /^placeholder$/,
        /^accept$/,
        /^autocomplete$/,
        /^autofocus$/,
        /^capture$/,
        /^max$/,
        /^maxlength$/,
        /^min$/,
        /^minlength$/,
        /^required$/,
        /^readonly$/,
        /^pattern$/,
        /^multiple$/,
        /^step$/,
      ]
    });

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
    return parseNodes(nodes, {
      max_prop_length: 255,
      include_only_prop_list: [/^tabindex$/],
    });
  })(),
  // Counts the links or buttons only containing an icon.
  'icon_only_clickables': (() => {
    var clickables = document.querySelectorAll('a, button');
    return Array.from(clickables).reduce((n, clickable) => {
      var visible_text_length = clickable.textContent.trim().length;

      // Clickables containing 1-char text are assumed to be icons.
      // Note that this fails spectacularly for complex unicode points.
      // See https://blog.jonnew.com/posts/poo-dot-length-equals-two.
      if (visible_text_length == 1) {
        return n + 1;
      }

      if (clickable.querySelector('svg')) {
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
      var metadata = document.querySelector("meta[name='generator'i][content^='AMP Plugin'i]");
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
      attribute_usage_count: parseNodes(svg_elements).attribute_usage_count,
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
    const images_using_loading = [...document.querySelectorAll('img[loading], source[loading]')];

    // NOTE: -1 is used to represent images with no alt tag at all. Empty alt tags have a value of 0
    const alt_lengths = imgs.map(img => {
      if (!img.hasAttribute('alt')) {
        return -1;
      }

      // alt=" " is less correct but comparable to alt="" so we use trim
      // Also remove duplicate spaces to get a feel for how long alt tags really are
      return img.alt.trim().replace(/\s+/g, ' ').length;
    });

    /** @type {ParseNodeOptions} */
    const filter_options = {
      include_only_prop_list: [
        /^crossorigin$/,
        /^decoding$/,
        /^importance$/,
        /^intrinsicsize$/,
        /^ismap$/,
        /^loading$/,
        /^referrerpolicy$/,
        /^usemap$/,
        /^type$/,
        /^aria-.+$/,
      ],

      // Most img sources should be within this many characters. Help guard us from huge base64 values
      max_prop_length: 255,
    };

    const parsed_pictures = parseNodes(pictures, filter_options);
    const parsed_imgs = parseNodes(imgs, filter_options);
    const parsed_sources = parseNodes(sources, filter_options);

    return {
      pictures: parseNodes(pictures, filter_options),
      imgs: parseNodes(imgs, filter_options),
      sources: parseNodes(sources, filter_options),

      total_with_srcset: images_with_srcset.length,
      total_with_sizes: images_with_sizes.length,
      total_pictures_with_img: pictures_with_img.length,

      // Values specific properties. Cleaned and trimmed to make processing easier
      sizes_values: images_with_sizes.map(img => {
        const value = img.getAttribute('sizes') || '';
        return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
      }),
      loading_values: images_using_loading.map(img => {
        const value = img.getAttribute('loading') || '';
        return value.toLocaleLowerCase().replace(/\s+/gm, ' ').trim();
      }),
      alt_lengths: alt_lengths,
    };
  })(),

  'videos': (() => {
    const videos = document.querySelectorAll('video');
    const tracks = document.querySelectorAll('video track');

    const filter_options = {
      include_only_prop_list: [
        /^autoplay$/,
        /^controls$/,
        /^loop$/,
        /^muted$/,
        /^poster$/,
        /^preload$/,
        /^aria-.+$/,
      ],
      // Protect us from weird values
      max_prop_length: 255,
    };
    const parsed_videos = parseNodes(videos, filter_options);

    // Count the number of video elements that have a track element
    let total_videos_with_track_element = 0;
    for (let video of videos) {
      if (video.querySelector('track')) {
        total_videos_with_track_element++;
      }
    }

    const parsed_tracks = parseNodes(tracks, {max_prop_length: 255});
    parsed_videos.total_with_track = total_videos_with_track_element;
    parsed_videos.tracks = parsed_tracks;
    return parsed_videos;
  })(),

  'iframes': (() => {
    const iframes = document.querySelectorAll("iframe");
    const iframes_using_loading = [
      ...document.querySelectorAll("iframe[loading]"),
    ];

    /** @type {ParseNodeOptions} */
    return {
      iframes: parseNodes(iframes),

      loading_values: iframes_using_loading.map((iframe) => {
        const value = iframe.getAttribute("loading") || "";
        return value.toLocaleLowerCase().replace(/\s+/gm, " ").trim();
      }),
    };
  })(),

  'scripts': (() => {
    return parseNodes(document.scripts, {max_prop_length: 512});
  })(),

  'nodes_using_role': (() => {
    const nodes_with_role = [...document.querySelectorAll('[role]')];

    // Build an object with each key being a unique value of `role` and the
    // value being how often this role occurred
    const role_usage_and_count = {};
    for (const node of nodes_with_role) {
      const role = node.getAttribute('role').toLocaleLowerCase();

      if (!role_usage_and_count[role]) {
        role_usage_and_count[role] = 1;
        continue;
      }

      role_usage_and_count[role]++;
    }

    return {
      total: nodes_with_role.length,
      usage_and_count: role_usage_and_count,
    };
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
      aria_shortcut_values: aria_shortcut_nodes.map(node => node.getAttribute('aria-keyshortcuts').toLocaleLowerCase()),
      accesskey_values: accesskey_nodes.map(node => node.getAttribute('accesskey')),
    };
  })(),

  // What attribute values are used and how often are they used
  // NOTE: This will not pick up all of the attributes on scripts
  'attributes_used_on_elements': (() => {
    const attributes_and_count = {};
    walkNodes(document.documentElement, (node) => {
      const attribute_names = node.getAttributeNames();
      if (attribute_names.length <= 0) {
        return;
      }

      // Count how often each of these attributes shows up
      for (const name of attribute_names) {
        if (!attributes_and_count[name]) {
          attributes_and_count[name] = 1;
          continue;
        }

        attributes_and_count[name]++;
      }
    });

    return attributes_and_count;
  })(),

  'body_node': (() => {
    // Only a single element, so we can keep the data values
    return parseNode(document.body, {remove_data_prop_value: false}).attributes;
  })(),

  'html_node': (() => {
    // Only a single element, so we can keep the data values
    return parseNode(document.documentElement, {remove_data_prop_value: false}).attributes;
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
