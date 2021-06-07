# Summary of all custom metrics

Here you will find a summary of all the metrics used in their respective custom metrics file

# [almanac.js](https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/almanac.js) metrics

## 01.12
Whether the page contains any instances of <script type=module>.

`1` if true, `0` if false

## 01.13
Whether the page contains any instances of  <script nomodule>

`1` if true, `0` if false

## link-nodes
A JSON array of <link> nodes used in the <head> element.

Example response:

```json
{
  "total": 28,
  "nodes": [
    {
      "tagName": "link",
      "rel": "stylesheet",
      "href": "/static/css/normalize.css?v=112272e51c80ffe5bd01becd2ce7d656"
    },
    {
      "tagName": "link",
      "rel": "preload",
      "href": "/static/css/normalize.css?v=112272e51c80ffe5bd01becd2ce7d656",
      "as": "style"
    },
    ...
  ],
  "attribute_usage_count": {
    "rel": 28,
    "href": 28,
    "as": 8,
    "type": 5,
    "crossorigin": 5,
    "hreflang": 14
  }
}
```

## priority-hints
A JSON array of prioritized nodes and their key/value attributes. Checks for the `importance` attribute in `<link>` `<img>` `<script>` or `<iframe>`.

Example response:

```json
{
  "total": 28,
  "nodes": [
    {
      "tagName": "link",
      "rel": "...",
      "href": "...",
      "importance": "low",
    },
    {
      "tagName": "img",
      "href": "...",
      "importance": "low",
    },
    ...
  ],
  "attribute_usage_count": {
    "rel": 28,
    "href": 28,
    "as": 8,
    "type": 5,
    "importance": 32
  }
}
```

## meta-nodes
A JSON array of `<meta>` nodes within the `<head>` element.

Example response:

```json
"meta-nodes": {
  "total": 16,
  "nodes": [
    {
      "tagName": "meta",
      "charset": "UTF-8"
    },
    {
      "tagName": "meta",
      "name": "viewport",
      "content": "width=device-width, initial-scale=1"
    },
    {
      "tagName": "meta",
      "name": "description",
      "content": "The Web Almanac is an annual state of the web report combining the expertise of the web community with the data and trends of the HTTP Archive."
    },
    ...
  ],
  "attribute_usage_count": {
    "charset": 1,
    "name": 8,
    "content": 15,
    "property": 7
  }
}
```

## 10.5

*DEPRECATED*

Extracts schema.org elements and finds all @context and @type usage.

Example response:

```json
[
  "WebPage",
  "ImageObject",
  "Organization",
  "Person",
  "schema.org/Article",
  "ListItem",
  "schema.org/BreadcrumbList"
]
```

## seo-anchor-elements

*DEPRECATED*

Finds the total number of internal, external and hash links.

We also count `earlyHash` and `navigateHash`. If a hash link is found within the first three `<a>` elements, we also count it as a `earlyHash`. This is primarily used to discover skip links. Otherwise the has link is counted as a `navigateHash`

Example response:

```json
{
  "internal": 108,
  "external": 12,
  "hash": 1,
  "navigateHash": 0,
  "earlyHash": 1
}
```

## seo-titles

Counts the total number of `h1`, `h2`, `h3` and `h4` elements. And the total number of words used in each (split by a space). If none exist, the value for both `titleWords` and `titleElements` is `-1`

Example response:

```json
{
  "titleWords": 15,
  "titleElements": 6
}
```

## seo-words
Counts the total number of textual elements, and words are on the page. All `script` and and `style` elements are excluded. If an element is found to contain under 3 words, it is skipped over as well.

Example response:

```json
{
  "wordsCount": 391,
  "wordElements": 36
}
```

## input_elements
Captures all the `<input>` and `<select>` elements on the page.

Example response:

```json
{
  "total": 6,
  "nodes": [
    {
      "tagName": "select",
      "id": "table-of-contents-switcher-mobile"
    },
    {
      "tagName": "select",
      "id": "year-switcher-mobile"
    },
    {
      "tagName": "select",
      "id": "language-switcher-mobile"
    },
    {
      "tagName": "select",
      "id": "table-of-contents-switcher-mobile-footer"
    },
    {
      "tagName": "select",
      "id": "year-switcher-mobile-footer"
    },
    {
      "tagName": "select",
      "id": "language-switcher-mobile-footer"
    }
  ],
  "attribute_usage_count": {
    "id": 6,
    "data-label": 2
  }
}
```

## 06.47
Detects if the first child of `<head>` is a Google Fonts `<link>`. `1` if true, `0` if false.

## 08.39
Counts the number of `<link>` and `<script>` elements using the subresource integrity attribute.

Example response:

```json
{
  "link": 3,
  "script": 0
}
```

## 09.27
A JSON array of nodes with a tabindex and their key/value attributes.

To save space, only the `tagName` and `tabindex` are reported for each node. `attribute_usage_count` can be used to see how many times each attribute was used.

Example response:

```json
{
  "total": 150,
  "nodes": [
    {
      "tagName": "a",
      "tabindex": "0"
    },
    {
      "tagName": "a",
      "tabindex": "0"
    },
    {
      "tagName": "select",
      "tabindex": "0"
    },
    {
      "tagName": "a",
      "tabindex": "-1"
    },
    ...
  ],
  "attribute_usage_count": {
    "id": 13,
    "tabindex": 150,
    "class": 148,
    "aria-describedby": 2,
    "data-nav-digest": 1,
    "data-nav-selected": 1,
    "name": 2,
    "style": 5,
    "title": 43,
    "type": 2,
    "value": 2,
    "autocomplete": 1,
    "placeholder": 1,
    "dir": 1,
    "aria-label": 21,
    "href": 50,
    "data-nav-ref": 1,
    "data-nav-role": 1,
    "data-ux-jq-mouseenter": 3,
    "data-csa-c-type": 31,
    "data-csa-c-slot-id": 31,
    "data-csa-c-content-id": 30,
    "data-csa-c-id": 31,
    "aria-disabled": 4,
    "aria-hidden": 15,
    "data-elementid": 2,
    "playsinline": 1,
    "role": 90,
    "lang": 1,
    "aria-valuenow": 2,
    "aria-valuemin": 2,
    "aria-valuemax": 2,
    "aria-live": 1,
    "aria-valuetext": 1,
    "aria-checked": 1,
    "data-testid": 1,
    "data-id": 83
  }
}
```

## icon_only_clickables

Counts the number of `<a>` or `<button>` elements only containing an icon. Clickables containing 1-char text are also assumed to be icons.

The response is an integer of how many were on the site. `0` if none.

## amp-plugin

A string containing the entire `content` property of the meta elements matching `<meta name="generator" content="AMP Plugin...">`. If this `<meta>` tag was not detected, this value is `null`

## inline_svg_stats
The total number of `<svg>`'s used, their combined content length, and all the attributes used on the `<svg>` elements (not any of their child elements).

Example response:

```json
{
  "total": 1,
  "content_lengths": [
    944
  ],
  "attribute_usage_count": {
    "width": 1,
    "height": 1,
    "viewbox": 1,
    "version": 1,
    "xmlns": 1,
    "xmlns:xlink": 1,
    "data-testid": 1,
    "role": 1,
    "aria-labelledby": 1
  }
}
```

## images

Stats of `<img>`, `<source>` and `<picture>` elements.

*Note:* In `alt_lengths`, -1 is used to represent images with no alt tag at all. Empty alt tags have a value of 0

Example response:

```json
{
  "pictures": {
    "total": 0,
    "nodes": [],
    "attribute_usage_count": {}
  },
  "imgs": {
    "total": 217,
    "nodes": [
      {
        "tagName": "img"
      },
      {
        "tagName": "img"
      },
      {
        "tagName": "img"
      },
      {
        "tagName": "img"
      },
      ...
    ],
    "attribute_usage_count": {
      "src": 216,
      "style": 2,
      "alt": 215,
      "height": 155,
      "width": 6,
      "data-a-hires": 213,
      "class": 194,
      "id": 1,
      "data-bind": 1
    }
  },
  "sources": {
    "total": 0,
    "nodes": [],
    "attribute_usage_count": {}
  },
  "total_with_srcset": 0,
  "total_with_sizes": 0,
  "total_pictures_with_img": 0,
  "sizes_values": [],
  "loading_values": [],
  "alt_lengths": [
    0,
    76,
    139,
    82,
    30,
    45,
    13,
    -1,
    -1,
    0,
    ...
  ]
}
```

## videos

Stats of `<video>` and `<track>` elements.

Example response:

```json
{
  "total": 1,
  "nodes": [
    {
      "tagName": "video",
      "poster": "https://images-na.ssl-images-amazon.com/.../slate.jpg"
    }
  ],
  "attribute_usage_count": {
    "class": 1,
    "webkit-playsinline": 1,
    "playsinline": 1,
    "poster": 1,
    "src": 1
  },
  "tracks": {
    "total": 0,
    "nodes": [],
    "attribute_usage_count": {}
  }
}
```

## iframes

Stats about `<iframe>` elements

Example response:

```json
{
  "iframes": {
    "total": 1,
    "nodes": [
      {
        "tagName": "iframe",
        "id": "DAsis",
        "src": "//s.amazon-adsystem.com/...",
        "width": "1",
        "height": "1",
        "frameborder": "0",
        "marginwidth": "0",
        "marginheight": "0",
        "scrolling": "no",
        "o46fdkdxl": ""
      }
    ],
    "attribute_usage_count": {
      "id": 1,
      "src": 1,
      "width": 1,
      "height": 1,
      "frameborder": 1,
      "marginwidth": 1,
      "marginheight": 1,
      "scrolling": 1,
      "o46fdkdxl": 1
    }
  }
}
```

## scripts

Stats about `<script>` elements.

Example response:

```json
{
  "total": 8,
  "nodes": [
    {
      "tagName": "script",
      "type": "application/ld+json"
    },
    {
      "tagName": "script",
      "type": "application/ld+json"
    },
    {
      "tagName": "script",
      "nonce": ""
    },
    {
      "tagName": "script",
      "async": "",
      "src": "/static/js/almanac.js?v=a048e74d864cb071cf57bbec86f4cfdc"
    },
    {
      "tagName": "script",
      "defer": "",
      "src": "/static/js/send-web-vitals.js?v=f176ee2628e8a2a549a6f5f3e122ee22"
    },
    ...
  ],
  "attribute_usage_count": {
    "type": 2,
    "nonce": 2,
    "async": 2,
    "src": 4,
    "defer": 2
  }
}
```

## nodes_using_role

The total number of nodes using the `role` attribute, and how often each value of `role` was used

Example response:

```json
{
  "total": 269,
  "usage_and_count": {
    "navigation": 2,
    "search": 1,
    "button": 87,
    "main": 1,
    "list": 8,
    "listitem": 140,
    "presentation": 18,
    "region": 1,
    "slider": 2,
    "menu": 3,
    "menuitemradio": 1,
    "dialog": 1,
    "document": 1,
    "image": 1,
    "tooltip": 1,
    "complementary": 1
  }
}
```

## headings_order

What order the headings levels are on the page. Can be used to determine if there were heading levels skipped

Example response:

```json
[
  1,
  2,
  2,
  3,
  2,
  2
]
```

## shortcuts_stats

What `accesskey` or `aria-keyshortcuts` values are used.

Example response:

```json
{
  "total_with_aria_shortcut": 2,
  "total_with_accesskey": 1,
  "aria_shortcut_values": ["Alt+Shift+M", "Alt+Shift+B"],
  "accesskey_values": ["s"]
}
```

## attributes_used_on_elements

The attributes used across the entire page, and how many times each was used.

Example response:

```json
{
  "lang": 51,
  "charset": 1,
  "name": 8,
  "content": 15,
  "rel": 30,
  "href": 150,
  "as": 9,
  "type": 14,
  "crossorigin": 5,
  "property": 7,
  "hreflang": 15,
  "class": 171,
  "xmlns": 1,
  "width": 15,
  "height": 15,
  "display": 1,
  "id": 41,
  "viewBox": 9,
  "d": 9,
  "fill": 11,
  "fill-rule": 1,
  "clip-rule": 1,
  "cx": 2,
  "cy": 2,
  "r": 1,
  "stroke-width": 3,
  "stroke-miterlimit": 3,
  "stroke": 3,
  "rx": 1,
  "ry": 1,
  "aria-label": 10,
  "aria-expanded": 7,
  "data-event": 4,
  "data-label": 4,
  "aria-labelledby": 10,
  "data-open-text": 1,
  "data-close-text": 1,
  "for": 6,
  "selected": 6,
  "disabled": 4,
  "value": 88,
  "aria-hidden": 3,
  "role": 9,
  "xmlns:xlink": 9,
  "xlink:href": 9,
  "nonce": 2,
  "x": 1,
  "y": 1,
  "src": 9,
  "alt": 5,
  "loading": 4,
  "async": 2,
  "defer": 2
}
```

## body_node

The attributes used on the `<body>` node.

*Note: `tagName` is not an attribute used on the element, but what type of node the element is*

Example response:

```json
{
  "tagName": "body",
  "class": "year-2020"
}
```

## html_node

The attributes used on the `<html>` node.

*Note: `tagName` is not an attribute used on the element, but what type of node the element is*

Example response:

```json
{
  "tagName": "html",
  "lang": "en-us",
  "class": "...",
  "data-useragent": "...",
  "data-platform": "..."
}
```

## document_title

The `<title>` tag value and its length

Example response:

```json
{
  "value": "The 2020 Web Almanac",
  "length": 20
}
```

## length_of_h1s

An array containing the length of every `<h1>` on the page

Example response:

```json
[5, 12, 11]
```
