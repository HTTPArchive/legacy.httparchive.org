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

var errors = [];

function logError(context, messageOrException, exception = null) {
  let error = {type: "error", context: context};

  try {
    if (typeof messageOrException === 'string') {
      error.message = messageOrException;
    } 
    else if (messageOrException instanceof Object) {
      error.exception = messageOrException;

      if (messageOrException.message) {
        error.message = messageOrException.message;
      }
      else {
        error.message = JSON.stringify(messageOrException, Object.getOwnPropertyNames(messageOrException));
      }
    }
    else {
      error.message = JSON.stringify(messageOrException);
    }

    if (exception) {
      error.exception = exception;

      if(exception.message) {
        error.message += ": "+exception.message;
      }
    }
  }
  catch(e) {
    error.message = "logError failed";
    error.exception = e;
  }

  errors.push(error);

  return error;
}

try {

var _wptBodies = [];
try {
  _wptBodies = $WPT_BODIES; 
}
catch (e) {
  logError("wptBodies", "Data returned was not valid", e);
 }

let _rawHtmlDom = null;
let _rawHtml = null;
function getRawHtmlDom() {
  if (!_rawHtmlDom && _wptBodies.length > 0) {
    
    let html = getRawHtml();

    _rawHtmlDom = document.createElement('div');
    _rawHtmlDom.innerHTML = html;
  }
  
  return _rawHtmlDom;
}

function getRawHtml() {
  if (!_rawHtml && _wptBodies.length > 0) {  
    _rawHtml = _wptBodies[0].response_body;
  }
  return _rawHtml;
}

function getResponseHeaders(name) {
  return _wptBodies[0]?.response_headers[name]?.split("\n");
}
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

        if (attribute.name) {
            el[attribute.name.toLowerCase()] = attribute.value;
        }
      }

      parsedNodes.push(el);
    }
  }
  return parsedNodes;
}

// returns text with regard to SEO. Visible text and image alt text,
function seoText(node) {

  let tempNodes = [];

  let images = node.querySelectorAll("img");

  for (var i = 0, len = images.length; i < len; i++) {
    var image = images[i];

    if (image.alt && image.alt.trim().length > 0) {

      var span = image.ownerDocument.createElement("SPAN");

      span.innerText = " ["+image.alt.trim()+"] ";

      image.parentNode.insertBefore(span, image.nextSibling);

      tempNodes.push(span);
    }
  }

  let text =  node.innerText.trim();


  tempNodes.forEach(t => t.parentNode.remove(t));

  return text;
}

var renderedPrimaryTitle = null;
var rawPrimaryTitle = null;

var almanac = {
  // 'requests': (() => {

  //   let result = [];

  //   _wptBodies.forEach((request) => {
  //     let r = {};

  //     r.url = request.url;

  //     if (request.request_headers) {
  //       r.request_headers = request.request_headers.length;
  //     }
  //     if (request.response_headers) {
  //        r.response_headers = request.response_headers.length;

  //        r['content-type'] = request.response_headers['content-type'] ?? "unknown"
  //     }

  //     if (r.url.includes("youtube")) {
  //       r.request = request;
  //     }
  //     result.push(r);
  //   });
  //   return result;
  // })(),
  'http_status_code': (() => {
    let statusArray = getResponseHeaders('status');

    if (statusArray)
      return statusArray[0];

    return null;
  })(),
  'doctype': document.doctype?.name ?? null,
  'favicon': !!document.querySelector('link[rel*="icon"]'),
  'viewport': document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null,
  // Wether the page contains <script type=module>.
  // Used by 2019/01_12
  '01.12': document.querySelector('script[type=module]') ? 1 : 0,

  // Wether the page contains <script nomodule>.
  // Used by 2019/01_13
  '01.13': document.querySelector('script[nomodule]') ? 1 : 0,

  // Used by SEO, 2019/01,2019/06, 2019/10, 2019/19
  'link_nodes': (() => {
    // Returns a JSON array of link nodes and their key/value attributes
    // Used by 01.14, 01.15, 01.16, 10.6,  06.46, 12.18
    var nodes = document.querySelectorAll('head link');
    var linkNodes = parseNodes(nodes);

    return linkNodes;
  })(),

  // Returns a JSON array of prioritized nodes and their key/value attributes
  // Used by 2019/19_7, 2019/19_8, 2019/19_9, 2019/19_10
  'priority_hints': (() => { 
    var nodes = document.querySelectorAll('link[importance], img[importance], script[importance], iframe[importance]');
    var parsedNodes = parseNodes(nodes);

    return parsedNodes;
  })(),

  // Returns a JSON array of meta nodes and their key/value attributes
  // Used by SEO, 2019/09_28
  'meta_nodes': (() => {     
    var nodes = document.querySelectorAll('head meta');
    var metaNodes = parseNodes(nodes);

    return metaNodes;
  })(),

    // noscript use
  // Used by SEO, 2019/09_28
  'noscript': (() => {   
    try {   
      let result = {iframe_googletagmanager_count: 0};

      var nodes = [...document.querySelectorAll('noscript')];

      result.total = nodes.length;

      nodes.forEach((n) => {
        if (n.innerHTML.match(/googletagmanager\.com/g)) 
          result.iframe_googletagmanager_count++;
    });

      return result;
    }
    catch(e) {
      return logError("noscript", e);
    }
  })(),

  // buttons
  // Used by SEO, 2019/09_28
  'buttons': (() => {   
    try {   
      let result = {types: {}};

      var nodes = [...document.querySelectorAll('button')];

      result.total = nodes.length;

      nodes.forEach((n) => {
        let type = n.getAttribute("type");

        if (type === "") {
          type = "-blank-";
        }

        if (type) {
            if (result.types[type])
              result.types[type]++;
            else 
              result.types[type] = 1;
        }

    });

      return result;
    }
    catch(e) {
      return logError("button", e);
    }
  })(),

    // dir attributes
  // Used by SEO, 2019/09_28
  'dirs': (() => {   
    try {   
      let result = {html_dir: null};

      function findDirs(selector) {
        let target = {values: {}};
        var nodes = [...document.querySelectorAll(selector)];

        target.total = nodes.length;
  
        nodes.forEach((n) => {
          let dir = n.getAttribute("dir");
  
          if (dir === "") {
            dir = "-blank-";
          }
  
          if (dir) {
            if (target.values[dir])
              target.values[dir]++;
            else 
              target.values[dir] = 1;
          }
  
        });
        return target;
      };

      let dir = document.querySelector('html[dir]')?.getAttribute("dir");

      if (dir === "" || dir)
        result.html_dir = dir;
      
      result.body_nodes_dir = findDirs('body *[dir]');

      return result;
    }
    catch(e) {
      return logError("dirs", e);
    }
  })(),

    // input
  // Used by SEO, 2019/09_28
  'inputs': (() => {   
    try {   
      let result = {types: {}};

      var nodes = [...document.querySelectorAll('input')];

      result.total = nodes.length;

      nodes.forEach((n) => {
        let type = n.getAttribute("type");

        if (type === "") {
          type = "-blank-";
        }

        if (type) {
            if (result.types[type])
              result.types[type]++;
            else 
              result.types[type] = 1;
        }

    });

      return result;
    }
    catch(e) {
      return logError("input", e);
    }
  })(),

      // input
  // Used by SEO, 2019/09_28
  'scripts': (() => {   
    try {   
      let result = {types: {}, inline: 0, src: 0};

      var nodes = [...document.querySelectorAll('script')];

      result.total = nodes.length;

      nodes.forEach((n) => {
        let type = n.getAttribute("type");

        if (type === "") {
          type = "-blank-";
        }

        if (type) {
            if (result.types[type])
              result.types[type]++;
            else 
              result.types[type] = 1;
        }

        let src = n.getAttribute("src");

        if (src === "") {
          src = "-blank-";
        }

        if (src)
          result.src++;
        else 
          result.inline++;

    });

      return result;
    }
    catch(e) {
      return logError("scripts", e);
    }
  })(),

  'videos': (() => {

    let result = {autoplay: {}};

    const nodes = document.querySelectorAll('video');

    nodes.forEach((n) => {
      let autoplay = n.getAttribute("autoplay");

      if (autoplay === "") {
        autoplay = "-blank-";
      }

      if (result.autoplay[autoplay])
        result.autoplay[autoplay]++;
      else 
        result.autoplay[autoplay] = 1;
      });

    result.total = nodes.length;
    result.props = parseNodes(nodes);

    return result;
  })(),

  'audios': (() => {

    let result = {autoplay: {}};

    const nodes = document.querySelectorAll('audios');

    nodes.forEach((n) => {
      let autoplay = n.getAttribute("autoplay");

      if (autoplay === "") {
        autoplay = "-blank-";
      }

      if (result.autoplay[autoplay])
        result.autoplay[autoplay]++;
      else 
        result.autoplay[autoplay] = 1;
      });

    result.total = nodes.length;
    result.props = parseNodes(nodes);

    return result;
  })(),

  // Parse <input> elements
  // Used by 2019/12*, 2019/09_30b
  'input_nodes': (() => {   
    var nodes = document.querySelectorAll('input, select');
    var inputNodes = parseNodes(nodes);

    return inputNodes;
  })(),

  // Looks at links and identifies internal, external or hashed as well as rel attributes and if a link is image only
  // Used by: SEO, 2019/09_10 
  'anchor_links': (() => {
    try {   
      var nodes = document.getElementsByTagName('a');
      var link = document.createElement('a');

      var hostname = document.location.hostname;

      var internal = 0; // metric 10.10
      var external = 0; // metric 10.10
      var external_same_domain = 0; // metric 10.10
      var external_different_domain = 0; // metric 10.10
      var hash = 0;
      var navigate_hash = 0; // metric 10.11
      var early_hash = 0; // metric 09.10
      
      var nofollow = 0;
      var ugc = 0;
      var sponsored = 0;
      var image_link = 0;

      var target_blank = {total: 0, noopener_noreferrer: 0, noopener: 0, noreferrer: 0, neither: 0};
      var noopener = 0;
      var noreferrer = 0;

      if (nodes) {
        for (var i = 0, len = nodes.length; i < len; i++) {
          var node = nodes[i];

          // our local parser trick
          if (node.href) {
            link.href = node.href;

            if (hostname === link.hostname) {
              internal++;
              if (document.location.pathname === link.pathname && link.hash.length > 1) {
                // check if hash matches an element in the DOM (scroll to)
                try {
                  var element = document.querySelector(link.hash);
                  if (element) {
                    hash++;
                    if (i < 3) {
                      early_hash++;
                    }
                  } else {
                    navigate_hash++;
                  }
                } catch (e) {}
              }
            } else { // if (document.location.hostname !== link.hostname) {
              external++;

              // check if the same domain
              if (hostname.endsWith('.'+link.hostname) || link.hostname.endsWith('.'+hostname)) {
                external_same_domain++;
              }
              else {
                external_different_domain++;
              }
            }


            let current_noopener = false;
            let current_noreferrer = false;
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
                            case "noopener":
                              noopener++;
                              current_noopener = true;
                              break;
                            case "noreferrer":
                              noreferrer++;
                              current_noreferrer = true;
                              break;
                        }
                    });
                });
            }

            if (node.target == "_blank") {
              target_blank.total++;

              if (current_noopener && current_noreferrer) {
                target_blank.noopener_noreferrer++;
              } else if (current_noopener) {
                target_blank.noopener++;
              } else if (current_noreferrer) {
                target_blank.noreferrer++;
              } else {
                target_blank.neither++;
              }
            }

            // see if it is an image link
            // no visible text
            let noText = node.innerText.trim().length === 0;
            let hasImage = node.querySelector('img') !== null;

            if (noText) {
                if (hasImage) {
                  image_link++;
                }
                else {
                    // invisible link? 
                }
            }
          }
        }
      }

      return { internal, external, external_same_domain, external_different_domain, hash, navigate_hash, early_hash, nofollow, ugc, sponsored, image_link, noopener: noopener, noreferrer: noreferrer, target_blank: target_blank };
    }
    catch(e) {
      return logError("anchor_links", e);
    }
  })(),

  // Get the html lang attribute if present. Was previously done via SQL which only captured the first two characts of the value (country code)
  // Used by: SEO
  'html_lang': document.querySelector('html')?.getAttribute('lang')?.toLowerCase(),

  // visible word count
  // Used by: SEO
  'visible_words': (() => {

    let result = {
      rendered: document.body?.innerText?.match(/\S+/g)?.length, // \S+ matches none whitespace, which would be a word
    };

    var rawDom = getRawHtmlDom();

    if (rawDom) {
      document.body.appendChild(rawDom);

      result.raw = rawDom.innerText?.match(/\S+/g)?.length;

      document.body.removeChild(rawDom);
    }

    return result;
  })(),

  // Extract the real title tag contents  
  // Used by: SEO
  'title': (() => {
    try {    
      let result = {};

      function getTitles(d) {
        let target = {};
        target.count = Array.from(d.querySelectorAll('head title')).map(e => {
          let text = e.innerText.trim();
          let characters = text.length;
          let words = text.match(/\S+/g)?.length;

          if (text.length > 0 && !target.primary) {
            if (d == document) {
              renderedPrimaryTitle = text; // for the heading section
            }
            else {
              rawPrimaryTitle = text; // for the heading section
            }

            target.primary = {
              characters: characters,
              words: words
            };
          }
          return {characters: characters, words: words };
        }).length;

        return target;
      }

      result.rendered = getTitles(document);

      let rawHtmlDom = getRawHtmlDom();

      if (rawHtmlDom) {
        result.raw = getTitles(rawHtmlDom);
      }

      return result; 
    }
    catch(e) {
      return logError("title", e);
    }
  })(),

  // Extract the real meta description tag contents  
  // Used by: SEO
  'meta_description': (() => {
    try {    
      let result = {};

      function getMetaDescriptions(d) {
        let target = {};
        target.count = Array.from(d.querySelectorAll('head meta[name="description"]')).map(e => {
          let text = e.getAttribute("content") ?? "";
          let characters = text.length;
          let words = text.match(/\S+/g)?.length;

          if (text.length > 0 && !target.primary) {
            target.primary = {
              characters: characters,
              words: words
            };
          }
          return {characters: characters, words: words };
        }).length;

        return target;
      }

      result.rendered = getMetaDescriptions(document);

      let rawHtmlDom = getRawHtmlDom();

      if (rawHtmlDom) {
        result.raw = getMetaDescriptions(rawHtmlDom);
      }

      return result; 
    }
    catch(e) {
      return logError("meta_description", e);
    }
  })(),

   // Extract hreflang info  
   // https://support.google.com/webmasters/answer/189077?hl=en
  // Used by: SEO
  'hreflang': (() => {
    try {    
      let result = {http_header: []};

      function getHreflangValues(d) {
        let target = {values: []};
        let hreflangs = Array.from(d.querySelectorAll('link[rel="alternate"][hreflang]'));

        hreflangs.forEach(e => {
          target.values.push(e.getAttribute("hreflang"));
        });

        return target;
      }

      result.rendered = getHreflangValues(document);

      let rawHtmlDom = getRawHtmlDom();

      if (rawHtmlDom) {
        result.raw = getHreflangValues(rawHtmlDom);
      }

      let linkHeaders = getResponseHeaders("link");
      if (linkHeaders) {
        linkHeaders.forEach((h) => {
          let matches = h.matchAll(/hreflang=['"]?(.*?)['"]/g);

          for (const match of matches) {
            let c =match[1];
            result.http_header.push(c);
          }  
        })
      }

      return result; 
    }
    catch(e) {
      return logError("hreflang", e);
    }
  })(),

  // content information including visible words and number of headings
  // Used by: SEO
  'headings': (() => { 
    try {  
      

      function processHeading(d, target, n) {
        let text = seoText(n);

        let words = text.match(/\S+/g)?.length;

        if (text.length > 0 && !result.primary) {
          let primaryTitle = "";
          if (d == document) {
            primaryTitle = renderedPrimaryTitle; 
          }
          else {
            primaryTitle = rawPrimaryTitle; 
          }

          target.primary = {
            words: words,
            characters: text.length,
            matches_title: text.toLowerCase() == primaryTitle?.toLowerCase()
          }
        }
        return {characters: text.length, words: words ?? 0};
      }
      
      function processHeadings(d) {
        let target = {};
        for(let l=1; l < 9; l++) {
          let nodes = Array.from(d.querySelectorAll('h'+l));

          let characters = 0;
          let words = 0;
          // if don't have a primary heading yet, search for one.
          
          var hs = nodes.map(n => {
            let h = processHeading(d, target, n);
            characters += h.characters;
            words += h.words;
            return h;
          });
    
          target["h"+l] = {
            count: nodes.length,
            non_empty_count: nodes.filter(e => seoText(e).length > 0).length,
            characters: characters,
            words: words
          };
        }
        return target;
      }

      let result = {};

      result.rendered = processHeadings(document);

      let rawHtmlDom = getRawHtmlDom();

      if (rawHtmlDom) {
        result.raw = processHeadings(rawHtmlDom);
      }

      if (renderedPrimaryTitle && rawPrimaryTitle) {
        result.title_changed_on_render = renderedPrimaryTitle != rawPrimaryTitle;
      }
   
      return result; 
    }
    catch(e) {
      return logError("headings", e);
    }
  })(),



  // content information including visible words and number of headings
  // Used by: SEO
  'structured_data': (() => {  
    try { 
      var link = document.createElement('a');

      function nestedJsonldLookup(target, items, depth, context) {
        if (items instanceof Array) {
          // loop array and process any objects in it 
          for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            if (item instanceof Object) {
              nestedJsonldLookup(target, item, depth+1, context);
            }
          }
        }
        else if (items instanceof Object) {
          // process object
          target.items_by_format.jsonld++;

          if (items['@context']) {
            let c = null;
            if (typeof items['@context'] === 'string') { 
              c = items['@context'];
            }
            else {
              c = "http://complex-context.com/"; // can only deal with simple contexts for now
            }

            if (c) {
              try {
              link.href = items['@context'];
              context = link.href;
              }
              catch (e) {
                context = "http://invalid-context.com/";
              }
              
            }
          }

          let type = context + "-UnknownType-";

          if (items['@type']) {
            let t =null;

            if (typeof items['@type'] === 'string') { 
              t = items['@type'];
            }
            else {
              t = "-ComplexType-"; // can only deal with simple contexts for now
            }
            if (t) {
              if (t.startsWith('http')) {
                  try {
                    link.href = t;
                    type = link.href;
                  }
                  catch (e) {
                    type = context + "-InvalidType-";
                  }
              } else {
                link.href = context + t.trimStart('/');
                type = link.href;
              }
            }
          }

          addType(target, target.jsonld_and_microdata_types, type, true);
 
          // process any properties that have arrays or objects
          var keys = Object.keys(items);
          for (var i = 0, len = keys.length; i < len; i++) {
            var item = items[keys[i]];
            // if array or object, dive into it
            if (keys[i] === "logo") {
              target.logo = true;
            }
            if (item instanceof Object || item instanceof Array) {
              nestedJsonldLookup(target, item, depth++, context);
            }
          }
        }
      }

      function addType(target, array, type, jsonld) {
        link.href = type;
        let www = false;
        let hostname = link.hostname;
        

        if (hostname.startsWith("www.")) {
          www = true;
          hostname = hostname.substring("www.".length);
        }

        let name = hostname + link.pathname; 

        let item = array.find(i => i.name === name);       
        if (!item) {
          item = {name: name, count: 0, jsonld: 0, microdata: 0, https: 0, http: 0, www: 0};
          array.push(item);
        }  

        item.count++;

        if (link.protocol === 'https:') 
          item.https++;        
        else 
          item.http++;

        if (www) 
          item.www++;   

        if (jsonld) 
          item.jsonld++;
        else 
          item.microdata++;

        if (!target.context_hostnames.includes(hostname)) {
          target.context_hostnames.push(hostname);
        }

        if (name === "schema.org/SearchAction") {
          target.sitelinks_search_box = true;
        }
      }

      function gatherStructuredData(d) {

        let target = {
          jsonld_and_microdata_types: [],
          logo: false,
          sitelinks_search_box: false,
          items_by_format: {
            microformats2: 0,
            microdata: 0,
            jsonld: 0,
            rdfa: 0
          },
          context_hostnames: []
        };

        // json-ld
        let jsonld_scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'));

        target.jsonld_scripts = {
          count: jsonld_scripts.length,
          errors: jsonld_scripts.filter(e => {
            try {
              var cleanText = e.textContent.trim();
              var cleanText = cleanText.replace(/^\/\*(.*?)\*\//g, ''); // remove * comment from start (could be for CDATA section) does not deal with multi line comments
              var cleanText = cleanText.replace(/\/\*(.*?)\*\/$/g, ''); // remove * comment from end (could be for CDATA section) does not deal with multi line comments

              nestedJsonldLookup(target, JSON.parse(cleanText), 0, "http://no-context.com/");
              return false; // its good
            }
            catch(e) {
              return true; // its bad
            }
          }).length
        };

        // microdata
        var microdataNodes = d.querySelectorAll('[itemtype]');
        for (var i = 0, len = microdataNodes.length; i < len; i++) {
          var node = microdataNodes[i];

          link.href = node.getAttribute('itemtype');

          let type = link.href;

          addType(target, target.jsonld_and_microdata_types, type, false);  

          target.items_by_format.microdata++;    
        }

        if (d.querySelector("[itemprop$='logo']")){
          target.logo = true;
        }
        
        if (d.querySelector("[itemtype$='SearchAction']")){
          target.sitelinks_search_box = true;
        }

        // rdfa
        target.items_by_format.rdfa = d.querySelectorAll('[typeof]').length;

        // microformats
        target.microformats2_types = [];
        ["h-adr","h-card","h-entry","h-event","h-feed","h-geo","h-item","h-listing draft","h-product","h-recipe","h-resume","h-review","h-review-aggregate"].forEach(name => {
          let items = d.querySelectorAll('.'+name);
          if (items.length > 0) {
            target.microformats2_types.push({name: name, count: items.length});
            target.items_by_format.microformats2 += items.length;
          }
        });

        return target;
      }

      let r = {};
      r.rendered = gatherStructuredData(document);

      let rawHtmlDom = getRawHtmlDom();

      if (rawHtmlDom) {
        r.raw = gatherStructuredData(rawHtmlDom);
      }
      
      return r; 
    }
    catch(e) {
      return logError("structured-data", e);
    }
  })(),

  // data on img tags including alt, loading, width & height attribute use
  // Used by: SEO  
  'images': (() => {   
    try { 
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
              missing_width: 0,
              missing_height: 0
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

          if (!node.hasAttribute("width")) result.dimensions.missing_width++;
          if (!node.hasAttribute("height")) result.dimensions.missing_height++;
      });

      return result;
    }
    catch(e) {
      return logError("images", e);
    }
  })(),

    // amp related data
  // Used by: SEO  
  'raw_html': (() => {  
    try {
      let result = {};

      let rawHtml = getRawHtml();

      if (rawHtml) {

        result.body = !!rawHtml.match(/<body/g);
        result.html = !!rawHtml.match(/<html/g);
        result.head = !!rawHtml.match(/<head/g);

        let headmatch = rawHtml.match(/<head.*<\/head>/gs); // s = match newlines

        if (headmatch) {
          result.head_size = headmatch[0].length;
        }

        let commentMatches = rawHtml.match(/<!--/g);

        if (commentMatches) {
          result.comment_count = commentMatches.length;
        }

        let ifCommentMatches = rawHtml.match(/<!-- *\[ *if/gs);

        if (ifCommentMatches) {
          result.conditional_comment_count = ifCommentMatches.length;
        }
      }

      return result;
    }
    catch(e) {
      return logError("raw_html", e);
    }
  })(),

  // amp related data
  // Used by: SEO  
  'amp': (() => {  
    try {
      let result = {};

      result.html_amp_attribute_present = !!document.querySelector('html')?.hasAttribute('amp');

      result.rel_amphtml = document.querySelector("link[rel='amphtml']")?.getAttribute('href') ?? null;

      var metadata = document.querySelector('meta[name=generator][content^="AMP Plugin"]');
      if (metadata) {
        result.amp_plugin =  metadata.getAttribute('content') ?? null;
      }

      return result;
    }
    catch(e) {
      return logError("amp", e);
    }
  })(),

  // data-nosnippet use 
  // Used by: SEO
  'data_nosnippet': (() => {     
      // https://support.google.com/webmasters/answer/79812?hl=en
      // https://developers.google.com/search/reference/robots_meta_tag
      var validNodes = document.querySelectorAll('span[data-nosnippet], div[data-nosnippet], section[data-nosnippet]');
      var allNodes = document.querySelectorAll('[data-nosnippet]');
      return { valid: validNodes.length, wrong_tag_type: allNodes.length - validNodes.length};
  })(),

  // Extracts words on the page to flag thin content pages
  // Used by: SEO  (Probably will go)
  'words': (() => {   
    // SEO: I'm not sure we will still use this. The content property should return more accurate word counts and is far simpler.
    try {
      function analyseTextNode(node) {
        // remove extra whitespace
        var nodeText = node.textContent.trim().replace(/\s+/g, ' '); // shrink spaces down to one
        // splitting on a whitespace, won't work for e.g. Chinese
        var nodeWordsCount = nodeText.split(' ').length;

        if (nodeWordsCount > 3) { // ignores nodes with 3 or less words?
          // update counts
          words_count += nodeWordsCount;
          word_elements++;
        }
      }

      var body = document.body;
      var words_count = -1;
      var word_elements = -1;
      if (body) {
        words_count = 0;
        word_elements = 0;
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
      return { words_count, word_elements };
    }
    catch(e) {
      return logError("words", e);
    }
  })(),


  // The first canonical value in the page 
  // Used by: SEO
  'canonical': (() => {
    try {
      function processCanonical(c) {
        if (c === result.url) 
          result.self_canonical = true;
       else 
          result.other_canonical = true;

        if (result.canonicals.includes(c)) 
          result.canonicals[c]++;
        else 
          result.canonicals[c] = 1;
      }

      let result = {rendered: {}, raw: {}, self_canonical: false, other_canonical: false, canonicals: []};
      result.url = document.location.href.split("#")[0];

      // headers
      let canonicalLinkHeaders = [];
        // Link: <https://example.com/page-b>; rel="canonical"
      let linkHeaders = getResponseHeaders("link");
      if (linkHeaders) {
        linkHeaders.forEach((h) => {
          let matches = h.matchAll(/<([^>]*)> *; *rel=['"]?canonical['"]?/g);

          for (const match of matches) {
            let c = match[1];
            canonicalLinkHeaders.push(c);
            processCanonical(c);
          }       
        })
      }
      result.http_header_link_canoncials = canonicalLinkHeaders;

      // raw canonicals
      let rawHtmlDom = getRawHtmlDom();
      if (rawHtmlDom) {
        result.raw.html_link_canoncials = [...rawHtmlDom.querySelectorAll('link[rel="canonical"]')].map(n => {
          let c = n.href ?? "-notset-";
          processCanonical(c);
          return c;
        });
      }

      // rendered
      let htmlCanonicalLinkNodes = document.querySelectorAll('link[rel="canonical"]');
      let htmlCanonicalLinks = [...htmlCanonicalLinkNodes].map(n => {
        let c = n.href ?? "-notset-";
        processCanonical(c);
        return c;
      });
      result.rendered.html_link_canoncials = htmlCanonicalLinks;

      result.canonical_missmatch = result.self_canonical && result.other_canonical;

      return result;
    }
    catch(e) {
      return logError("canonical", e);
    }
  })(),

  // Calculates robots status per type of robot 
  // Used by: SEO
  'robots': (() => {
    try {
      // https://developers.google.com/search/reference/robots_meta_tag
      let result = {
        x_robots_tag: getResponseHeaders("x-robots-tag"), // array
        has_robots_meta_tag: false,
        has_x_robots_tag: false
      }

      function processRobotsValue(destination, content) {
        content.split(",").forEach(part => {
          switch(part.split(":")[0].trim().toLowerCase()) {
            case "noindex":
              destination.noindex = true;
              destination.status_index = false;
              break;
            case "index":
                destination.index = true;
                break;
            case "follow":
              destination.follow = true;
              break;
            case "none":
              destination.none = true;
              destination.status_index = false;
              destination.status_follow = false;
              break;
            case "nofollow":
              destination.nofollow = true;
              break;
            case "noarchive":
              destination.noarchive = true;
              break;
            case "nosnippet":
              destination.nosnippet = true;
              break;
            case "unavailable_after":
              destination.unavailable_after = true;
              break;
            case "max-snippet":
              destination.max_snippet = true;
              break;
            case "max-image-preview":
              destination.max_image_preview = true;
              break;
            case "max-video-preview":
              destination.max_video_preview = true;
              break;
            case "notranslate":
              destination.notranslate = true;
              break;
            case "noimageindex":
              destination.noimageindex = true;
              break;
            case "nocache":
              destination.nocache = true;
              break;
          }
        });
      }
      function calculateRobots(d, selector, x_robots_name) {
        let robots = {
          status_index: true,
          status_follow: true,
          // noindex: false,
          // nofollow: false,
          // noarchive: false,
          // nosnippet: false,
          // unavailable_after: false,
          // max_snippet: false,
          // max_image_preview: false,
          // max_video_preview: false,
          // notranslate: false,
          // noimageindex: false,
          // nocache: false,
          via_meta_tag: false,
          via_x_robots_tag: false
        };

        Array.from(d.querySelectorAll(selector)).forEach(e => {
          if (e.hasAttribute("content")) {
            let content = e.getAttribute("content");
            robots.via_meta_tag = true;
            result.has_robots_meta_tag = true;
            processRobotsValue(robots, content)    
          }
        });

        if (result.x_robots_tag) {
          result.x_robots_tag.forEach((tag) => {
              let bot = "anybot";

              let t = tag.trim().toLowerCase();

              if (t.startsWith("googlebot:")) {
                bot = "googlebot";
                t = t.substring("googlebot:".length);
              } else if (t.startsWith("googlebot-news:")) {
                bot = "googlebot-news";
                t = t.substring("googlebot-news:".length);
              } else if (t.startsWith("otherbot:")) {
                t = t.substring("otherbot:".length);
              }

              if (bot === 'anybot') {
                robots.via_x_robots_tag = true;
                result.has_x_robots_tag = true;
                processRobotsValue(robots, t); // always process
              }

              if (bot === x_robots_name) {
                robots.via_x_robots_tag = true;
                result.has_x_robots_tag = true;
                processRobotsValue(robots, t);
              }
          
          });
        }

        // work out final indexing and follow status?

        return robots
      }

      function calculateAllRobots(d) {
        return {
          otherbot: calculateRobots(d, 'meta[name="robots"]', 'otherbot'),
          googlebot: calculateRobots(d, 'meta[name="robots"], meta[name="googlebot"]', 'googlebot'),
          googlebot_news: calculateRobots(d, 'meta[name="robots"], meta[name="googlebot-news"]', 'googlebot-news')
        };
      }

      result.rendered = calculateAllRobots(document);

      let rawHtmlDom = getRawHtmlDom();

      if (rawHtmlDom){
        result.raw = calculateAllRobots(rawHtmlDom);
      }

      return result;
    }
    catch(e) {
      return logError("robots", e);
    }

  })(),

  // Find first child of <head>
  // Whether the first child of <head> is a Google Fonts <link>
  // Used by: 2019/06_47
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

  // Counts the number of link/script elements with the subresource integrity attribute.
  // Used by: ?
  '08.39': (() => { 
    return {
      'link': document.querySelectorAll('link[integrity]').length,
      'script': document.querySelectorAll('script[integrity]').length
    };
  })(),

  // Returns a JSON array of nodes with a tabindex and their key/value attributes.
  // Used by: 2019/09_27
  '09.27': (() => {
    // We acknowledge that attribute selectors are expensive to query.
    var nodes = document.querySelectorAll('body [tabindex]');
    var parsedNodes = parseNodes(nodes);

    return parsedNodes;
  })(),

  // Counts the links or buttons only containing an icon
  // Used by: 2019/12_11
  // This site returns an array of 233 empty objects??? http://www.yoaview.com/Yoaview/SITE/
  '12.11': (() => {
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

  //  check if there is any picture tag containing an img tag
  'has_picture_img': document.querySelectorAll('picture img').length > 0
};

}
catch(e) { // probably an un caught exception
  logError("general", "Failed to create the almanac object", e);
  almanac = {};
}

if (!almanac) { // should not be possible
  almanac = {};
  logError("general", "almanac object was missing");
}

// add any logged errors to the almanac 
if (errors.length > 0) {
  almanac.errors = errors;
}

// for some reason we rturn the string. Maybe to make it easier for usin in BigQuery
return JSON.stringify(almanac);
