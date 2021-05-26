//[iframes]
// Uncomment the previous line for testing on webpagetest.org

// Sanitize the `attributes` property.
function getNodeAttributes(node) {
  // Inspired by dequelabs/axe-core.
  if (node.attributes instanceof NamedNodeMap) {
    return node.attributes;
  }
  return node.cloneNode(false).attributes;
}

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
    options
  );
  const attributes = Object.values(getNodeAttributes(node));
  const el = {};
  const attribute_names = new Set();
  const input_tag_names = new Set("input", "select", "textarea");

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

    if (
      options.include_only_prop_list &&
      options.include_only_prop_list.length > 0
    ) {
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

    if (
      options.remove_input_value &&
      input_tag_names.has(el.tagName) &&
      attribute_name === "value"
    ) {
      el[attribute_name] = "";
      continue;
    }

    for (const pattern of removal_patterns) {
      if (pattern.test(attribute_name)) {
        el[attribute_name] = "";
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
      el[attribute_name] = el[attribute_name].substr(
        0,
        options.max_prop_length
      );
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

return (() => {
  const iframes = document.querySelectorAll("iframe");
  const iframes_using_loading = [
    ...document.querySelectorAll("iframe[loading]"),
  ];

  /** @type {ParseNodeOptions} */
  const filter_options = {
    include_only_prop_list: [
      /^allow$/,
      /^allowfullscreen$/,
      /^allowpaymentrequest$/,
      /^height$/,
      /^loading$/,
      /^name$/,
      /^referrerpolicy$/,
      /^sandbox$/,
      /^src$/,
      /^srcdoc$/,
      /^width$/,
      /^aria-.+$/,
    ],

    max_prop_length: 255,
  };

  return {
    iframes: parseNodes(iframes, filter_options),

    loading_values: iframes_using_loading.map((iframe) => {
      const value = iframe.getAttribute("loading") || "";
      return value.toLocaleLowerCase().replace(/\s+/gm, " ").trim();
    }),
  };
})();
