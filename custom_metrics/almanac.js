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

var logs = [];

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

  logs.push(error);

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

 let _rawHtml = null;
 function getRawHtml() {
  if (!_rawHtml && _wptBodies.length > 0) {  
    _rawHtml = _wptBodies[0].response_body;
  }

//  _rawHtml = '<html><head><meta name="description" content="test"/></head><body>visible</body></html>';
  return _rawHtml;
}

let _rawHtmlDocument = null;

function getRawHtmlDocument() {
  if (!_rawHtmlDocument) {
    
    let html = getRawHtml();

    if (html) {

      _rawHtmlDocument = document.implementation.createHTMLDocument("New Document");

      _rawHtmlDocument.documentElement.innerHTML = html;

    }
  }
  
  return _rawHtmlDocument;
}

let _rawHtmlDiv = null;
function getRawHtmlDiv() {
  if (!_rawHtmlDiv) {
    
    let html = getRawHtml();

    if (html) {
      _rawHtmlDiv = document.createElement('div');
      _rawHtmlDiv.innerHTML = html;
    }
  }
  
  return _rawHtmlDiv;
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

  let images = [...node.querySelectorAll("img")];

  images.forEach((image) => {
    if (image.alt && image.alt.trim().length > 0) {

      var span = image.ownerDocument.createElement("SPAN");

      span.innerText = " ["+image.alt.trim()+"] ";

      image.parentNode.insertBefore(span, image.nextSibling);

      tempNodes.push(span);
    }
  });

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
  'rel_alternate_mobile': !!document.querySelector('link[rel="alternate"][media][href]'),
  'compatMode': document.compatMode,
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
  'noscripts': (() => {   
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
      return logError("noscripts", e);
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

        if (type) {
            if (result.types[type])
              result.types[type]++;
            else 
              result.types[type] = 1;
        }

    });

    result.props = parseNodes(document.querySelectorAll('input, select'));

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

        if (type) {
            if (result.types[type])
              result.types[type]++;
            else 
              result.types[type] = 1;
        }

        let src = n.getAttribute("src");

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

    const nodes = document.querySelectorAll('audio');

    nodes.forEach((n) => {
      let autoplay = n.getAttribute("autoplay");

      if (result.autoplay[autoplay])
        result.autoplay[autoplay]++;
      else 
        result.autoplay[autoplay] = 1;
      });

    result.total = nodes.length;
    result.props = parseNodes(nodes);

    return result;
  })(),


  'classes': (() => {

    let result = {names: {}, names_total: 0, references_total: 0};

    const nodes = document.querySelectorAll('*[class]');

    nodes.forEach((n) => {
      n.classList.forEach((name) => {
        result.references_total++;

        if (result.names[name]) {
          result.names[name]++;
        }
        else {
          result.names[name] =1;
          result.names_total++;
        }
      });
    });

    return result;
  })(),

  'ids': (() => {

    let result = {ids: {}, ids_total: 0, duplicates_total: 0};

    const nodes = document.querySelectorAll('*[id]');

    nodes.forEach((n) => {

        result.ids_total++;

        if (result.ids[n.id]) {
          result.ids[n.id]++;
          result.duplicates_total++;
        }
        else {
          result.ids[n.id] = 1;          
        }
     
    });

    return result;
  })(),

  // Looks at links and identifies internal, external or hashed as well as rel attributes and if a link is image only
  // Used by: SEO, 2019/09_10 
  'anchors': (() => {
    try {   
      let link = document.createElement('a');
      let location = document.location;

      // use d so could repeat on raw page

      let d = document;

      let nodes = d.getElementsByTagName('a');

      let hostname = location.hostname;

      let protocol = "";

      let result = {
        crawlable: {
          follow: 0,
          nofollow: 0
        },
        hash_link: 0,
        hash_only_link: 0,
        javascript_void_links: 0,
        same_page: {
          total: 0,
          jumpto: {
            total: 0,
            early: 0,
            other: 0,
            using_id: 0,
            using_name: 0
          },
          dynamic: {
            total: 0,
            onclick_attributes: {
              total: 0,
              window_location: 0,
              window_open: 0,
              unknown_action: 0
            },
            href_javascript: 0,
            hash_link: 0
          },
          other: {
            total: 0,
            hash_link: 0
          }
        },
        same_site: 0,
        same_property : 0,
        other_property  : 0,
        rel_attributes : {
          dofollow: 0,
          follow: 0,
          nofollow: 0,
          ugc: 0,
          sponsored: 0,
          noopener: 0,
          noreferrer: 0
        },
        image_links: 0,
        invisible_links: 0,
        text_links: 0,
        target_blank: {total: 0, noopener_noreferrer: 0, noopener: 0, noreferrer: 0, neither: 0},
        targets: {},
        protocols: {}
      };

    
      let index = 0;
      if (nodes) {
        [...nodes].forEach((node) => {
          index++;

          let crawlable = false;
          let samePage = false;
          let dealtWith = false;
          let hashBased = false;

          if (node.href && node.href.trim().length > 0) {
            link.href = node.href; // our local parser trick

            if (node.getAttribute("href") === "#") {
              result.hash_only_link++;
            } else if (node.getAttribute("href").includes("#")) {
              result.hash_link++;
            }

            protocol = link.protocol.replace(":", "").toLowerCase();

            if (result.protocols[protocol]) 
              result.protocols[protocol]++;
            else 
              result.protocols[protocol] = 1;

            switch(protocol) {
              case "http": // crawlable
              case "https": // crawlable
              crawlable = true;
                break;
              case "ftp": // crawlable
              crawlable = true;
                break;
              case "javascript":
                samePage = true;
                result.same_page.total++;
                if (link.href.includes("void")) {
                  result.javascript_void_links++;
                }
                break; 
              default:
                samePage = true;
                result.same_page.total++;
                break;     
            }
            if (!samePage) { // was not set by protocol
              if (hostname === link.hostname) {
                
                if (location.pathname === link.pathname) {
                  // same page
                  result.same_page.total++;
                  samePage = true; 
                }
                else {
                  // same site
                  result.same_site++;
                  dealtWith = true;
                }
              }
              else {
                if (hostname.endsWith('.'+link.hostname) || link.hostname.endsWith('.'+hostname)) {
                  // same property 
                  result.same_property++;
                  dealtWith = true;
                }
                else {
                    // other property
                    result.other_property++;
                    dealtWith = true;
                }
              }
            }

            if (samePage && link.hash.length > 1) { // >1 so not it include # only
              hashBased = true;
              crawlable = false;
              let id = link.hash.substring(1);
              if (d.getElementById(id)) { // matching id or name
                // working named anchor link
                result.same_page.jumpto.total++;
                result.same_page.jumpto.using_id++;
                dealtWith = true;

                if (index <= 3) {
                  result.same_page.jumpto.early++;
                } else {
                  result.same_page.jumpto.other++;
                }

              } else  if (d.querySelector("*[name='"+id+"']")) { // matching id or name
                // working named anchor link
                result.same_page.jumpto.total++;
                result.same_page.jumpto.using_name++;
                dealtWith = true;

                if (index <= 3) {
                  result.same_page.jumpto.early++;
                } else {
                  result.same_page.jumpto.other++;
                }

              }
              //else // # link with no clue

            }
            //else // link to self



           
  
          }
          else {
            // no href so class as same page
            result.same_page.total++;
          }

          // ok
          if (!dealtWith) {
            // still not worked out what it does. dynamic or other is left

          // https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/seo/crawlable-anchors.js

          // seems role is more for none links that behave links links: role="link". so this is for somewhere else.
            // let hasRole = node.hasAttribute("role") && node.getAttribute("role").trim().length > 0; // implies link is for an action not a crawlable link

            // if (hasRole) {
            //   result.dynamic.has_role++;
            //   dealtWith = true;
            // }

            let dynamic = false;

            if (node.hasAttribute("onclick"))
            {
              dynamic = true;
              result.same_page.dynamic.onclick_attributes.total++;

              let onclick = node.getAttribute("onclick");
              
              if (onclick.includes("window.location")) {
                result.same_page.dynamic.onclick_attributes.window_location++;
              } else if (onclick.includes("window.open")) {
                result.same_page.dynamic.onclick_attributes.window_open++;
              }
              else {
                result.same_page.dynamic.onclick_attributes.unknown_action++;
              }           
            }

            if (protocol.trim().toLowerCase() === "javascript") {
              result.same_page.dynamic.href_javascript++;
              dynamic = true;
            }

            // click based listeners?

            if (dynamic) {
              if (hashBased) {
                result.same_page.dynamic.hash_link++;
              }
              result.same_page.dynamic.total++;
            }
            else {
              result.same_page.other.total++;
              if (hashBased) {
                result.same_page.other.hash_link++;
              }
            }          
          }



          // other stuff

          let current_noopener = false;
          let current_noreferrer = false;
          let follow = true;
          // Checking rel attribute values 
          // https://support.google.com/webmasters/answer/96569?hl=en
          if (node.rel) {
              node.rel.split(" ").forEach(n1 => {
                  n1.split(",").forEach(n => {
                      switch (n.toLowerCase().trim()) {
                          case "nofollow":
                            result.rel_attributes.nofollow++;
                            follow = false;
                            break;
                          case "dofollow":
                            result.rel_attributes.dofollow++;
                            break;
                          case "follow":
                            result.rel_attributes.follow++;
                            break;
                          case "ugc":
                            result.rel_attributes.ugc++;
                            follow = false;
                            break;
                          case "sponsored":
                            result.rel_attributes.sponsored++;
                            follow = false;
                            break;
                          case "noopener":
                            result.rel_attributes.noopener++;
                            current_noopener = true;
                            break;
                          case "noreferrer":
                            result.rel_attributes.noreferrer++;
                            current_noreferrer = true;
                            break;
                      }
                  });
              });
          }

          if (node.target) {
            let target = node.target.trim();


            if (target == "_blank") {
              result.target_blank.total++;

              if (current_noopener && current_noreferrer) {
                result.target_blank.noopener_noreferrer++;
              } else if (current_noopener) {
                result.target_blank.noopener++;
              } else if (current_noreferrer) {
                result.target_blank.noreferrer++;
              } else {
                result.target_blank.neither++;
              }
            }

            if (result.targets[target]) 
              result.targets[target]++;
            else 
              result.targets[target] = 1;
          }

          // see if it is an image link
          // no visible text
          let noText = node.innerText.trim().length === 0;
          let hasImage = node.querySelector('img') !== null;

          if (noText) {
              if (hasImage) {
                result.image_links++;
              }
              else {
                  // invisible link? 
                  result.invisible_links++;
              }
          }
          else {
            result.text_links++;
          }

          if (crawlable) { // unless nofollow ???
            if (follow) {
              result.crawlable.follow++;
            } else
            {
              result.crawlable.nofollow++;
            }
          }

        });
      }

      return result;
    }
    catch(e) {
      return logError("anchors", e);
    }
  })(),

  // Get the html lang attribute if present. Was previously done via SQL which only captured the first two characts of the value (country code)
  // Used by: SEO
  'html_lang': document.querySelector('html')?.getAttribute('lang')?.toLowerCase(),



  // Extract the real title tag contents  
  // Used by: SEO
  'title': (() => {
    try {    
      let result = {};

      function getTitles(d) {
        let target = {};
        target.total = Array.from(d.querySelectorAll('head title')).map(e => {
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
              words: words,
              text: text
            };
          }
          return {characters: characters, words: words };
        }).length;

        return target;
      }

      result.rendered = getTitles(document);

      let rawHtmlDocument = getRawHtmlDocument();

      if (rawHtmlDocument) {
        result.raw = getTitles(rawHtmlDocument);
      }

      result.title_changed_on_render = renderedPrimaryTitle != rawPrimaryTitle;

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
        let target = {all: {text: "", words: 0, characters: 0}};       
        target.total = Array.from(d.querySelectorAll('head meta[name="description"]')).map(e => {
          let text = e.getAttribute("content") ?? "";
          let characters = text.length;
          let words = text.match(/\S+/g)?.length;

          target.all.text = (target.all.text+" "+text).trim();
          target.all.words += words;
          target.all.characters += characters;

          let snippet  = text;

          if (snippet.length > 500) {
            snippet = snippet.substring(0,500) + "...";
          }

          if (text.length > 0 && !target.primary) {
            target.primary = {
              characters: characters,
              words: words,
              text: snippet
            };
          }
          return {characters: characters, words: words };
        }).length;

        if (target.all.text.length > 500) {
          target.all.text = target.all.text.substring(0,500) + "...";
        }

        return target;
      }

      result.rendered = getMetaDescriptions(document);

      let rawHtmlDocument = getRawHtmlDocument();

      if (rawHtmlDocument) {
        result.raw = getMetaDescriptions(rawHtmlDocument);
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
      let result = {http_header: {values: []}};

      function getHreflangValues(d) {
        let target = {values: []};
        let hreflangs = Array.from(d.querySelectorAll('link[rel="alternate"][hreflang]'));

        hreflangs.forEach(e => {
          target.values.push(e.getAttribute("hreflang"));
        });

        return target;
      }

      result.rendered = getHreflangValues(document);

      let rawHtmlDocument = getRawHtmlDocument();

      if (rawHtmlDocument) {
        result.raw = getHreflangValues(rawHtmlDocument);
      }

      let linkHeaders = getResponseHeaders("link");
      if (linkHeaders) {
        linkHeaders.forEach((h) => {
          let matches = h.matchAll(/hreflang=['"]?(.*?)['"]/g);

          for (const match of matches) {
            let c =match[1];
            result.http_header.values.push(c);
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
      

      function processHeading(d, target, n, level) {
        let html  = n.innerHTML;
        let text = seoText(n);

        let words = text.match(/\S+/g)?.length;

        if (!target.primary) {
          if (text.length > 0) { // make this primary
            let primaryTitle = "";
            if (d == document) {
              primaryTitle = renderedPrimaryTitle; 
            }
            else {
              primaryTitle = rawPrimaryTitle; 
            }

            let snippet = text;

            if (snippet.length > 100) {
              snippet = snippet.substring(0, 100)+"...";
            }

            target.primary = {
              words: words,
              characters: text.length,
              matches_title: text.toLowerCase() == primaryTitle?.toLowerCase(),
              text: snippet,
              level: level
            }
          } else if (html.length > 0) {
            // looks like a hidden heading
            target.first_non_empty_heading_hidden = true;
          }
        }
        return {characters: text.length, words: words ?? 0};
      }
      
      function processHeadings(d) {
        let target = {first_non_empty_heading_hidden: false};
        for(let l=1; l < 9; l++) {
          let nodes = Array.from(d.querySelectorAll('h'+l));

          let characters = 0;
          let words = 0;
          // if don't have a primary heading yet, search for one.
          
          var hs = nodes.map(n => {
            let h = processHeading(d, target, n, l);
            characters += h.characters;
            words += h.words;
            return h;
          });
    
          target["h"+l] = {
            total: nodes.length,
            non_empty_total: nodes.filter(e => seoText(e).length > 0).length,
            characters: characters,
            words: words
          };
        }
        return target;
      }

      let result = {};

      result.rendered = processHeadings(document);

      let rawHtmlDocument = getRawHtmlDocument();

      if (rawHtmlDocument) {
        result.raw = processHeadings(rawHtmlDocument);
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

      function nestedJsonldLookup(target, jsonldIds, items, depth, context) {
        if (items instanceof Array) {
          // loop array and process any objects in it 
          for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            if (item instanceof Object) {
              nestedJsonldLookup(target, jsonldIds, item, depth+1, context);
            }
          }
        }
        else if (items instanceof Object) {
          // process object
          target.items_by_format.jsonld++;

          if (items['@id']) {
            if (typeof items['@id'] === 'string') {
              
              link.href = items['@id'];
              let id = link.href;

              if (jsonldIds[id]) {
                jsonldIds[id]++;
                // therefore a cross reference
                target.jsonldReferencedIds++;
              }
              else {
                jsonldIds[id] = 1;
                target.jsonldIds++;
              }
            }
          }

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
              nestedJsonldLookup(target, jsonldIds, item, depth++, context);
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
          jsonldIds: 0,
          jsonldReferencedIds: 0,
          microdataIds: 0,
          microdataReferencedIds: 0,
          jsonlsMicrodataCommonIds: 0,
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

        let jsonldIds = {};

        // json-ld
        let jsonld_scripts = Array.from(d.querySelectorAll('script[type="application/ld+json"]'));

        target.jsonld_scripts = {
          count: jsonld_scripts.length,
          errors: jsonld_scripts.filter(e => {
            try {
              var cleanText = e.textContent.trim();
              var cleanText = cleanText.replace(/^\/\*(.*?)\*\//g, ''); // remove * comment from start (could be for CDATA section) does not deal with multi line comments
              var cleanText = cleanText.replace(/\/\*(.*?)\*\/$/g, ''); // remove * comment from end (could be for CDATA section) does not deal with multi line comments

              nestedJsonldLookup(target, jsonldIds, JSON.parse(cleanText), 0, "http://no-context.com/");
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

        let microdataIds = {};

        let microdataItemIdNodes = [...d.querySelectorAll('[itemid]')];

        microdataItemIdNodes.forEach((n) => {
          link.href = n.getAttribute('itemid');

            let id = link.href;

            if (microdataIds[id]) {
              microdataIds[id]++;
              // therefore a cross reference
              target.microdataReferencedIds++;
            }
            else {
              microdataIds[id] = 1;
              target.microdataIds++;

              if (jsonldIds[id]) {
                // common id
                target.jsonlsMicrodataCommonIds++;
              }
            }
        });

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

      let rawHtmlDocument = getRawHtmlDocument();

      if (rawHtmlDocument) {
        r.raw = gatherStructuredData(rawHtmlDocument);
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
        total: 0,
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
          result.total++;
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

   // data on iframe tags including loading
  // Used by: SEO  
  'iframes': (() => {   
    try { 
      var nodes = document.querySelectorAll('iframe');

      let result = {
          total: 0,
          loading: {
              auto: 0,
              lazy: 0,
              eager: 0,
              invalid: 0,
              missing: 0,
              blank: 0
          }
      };

      nodes.forEach(node => {
          result.total++;

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
      });

      return result;
    }
    catch(e) {
      return logError("iframe", e);
    }
  })(),

  // data from the original html
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

      // valid amp page
      // https://amp.dev/documentation/guides-and-tutorials/learn/spec/amphtml/
      // doctype is html
      // html amp or ⚡ attribute
      // canonical link to real page
      // <meta charset="utf-8">
      // <meta name="viewport" content="width=device-width">
      // <script async src="https://cdn.ampproject.org/v0.js"></script>
      // boilerplate css

      result.html_amp_attribute_present = !!document.querySelector('html')?.hasAttribute('amp');

      result.html_amp_emoji_attribute_present = !!document.querySelector('html')?.hasAttribute('⚡');

      result.amp_page = result.html_amp_attribute_present || result.html_amp_emoji_attribute_present;

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


  // canonicals used in the page and http header
  // Used by: SEO
  'canonicals': (() => {
    try {
      function processCanonical(c) {
        if (c === result.url) 
          result.self_canonical = true;
       else 
          result.other_canonical = true;

        if (result.canonicals[c]) 
          result.canonicals[c]++;
        else 
          result.canonicals[c] = 1;
      }

      let result = {rendered: {}, raw: {}, self_canonical: false, other_canonical: false, canonicals: {}};
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
      let rawHtmlDocument = getRawHtmlDocument();
      if (rawHtmlDocument) {
        result.raw.html_link_canoncials = [...rawHtmlDocument.querySelectorAll('link[rel="canonical"]')].map(n => {
          let c = n.href ?? "";
          processCanonical(c);
          return c;
        });
      }

      // rendered
      let htmlCanonicalLinkNodes = document.querySelectorAll('link[rel="canonical"]');
      let htmlCanonicalLinks = [...htmlCanonicalLinkNodes].map(n => {
        let c = n.href ?? "";
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
        let r = {
          otherbot: calculateRobots(d, 'meta[name="robots"]', 'otherbot'),
          googlebot: calculateRobots(d, 'meta[name="robots"], meta[name="googlebot"]', 'googlebot'),
          googlebot_news: calculateRobots(d, 'meta[name="robots"], meta[name="googlebot-news"]', 'googlebot-news'),
          google: {}
        };
        // Find all Google values
        d.querySelectorAll("meta[name='google']").forEach((n) => {
            let v = n.getAttribute("content");

            if (v) {
              v.split(",").forEach((v1) => {v1.split(" ").forEach((v2) => {
                let v3 = v2.trim().toLowerCase();
                if (r.google[v3]) {
                  r.google[v3]++;
                }
                else {
                  r.google[v3] = 1;
                }
              })});
            }
        })

        return r;
      }

      result.rendered = calculateAllRobots(document);

      let rawHtmlDocument = getRawHtmlDocument();

      if (rawHtmlDocument){
        result.raw = calculateAllRobots(rawHtmlDocument);
      }

      return result;
    }
    catch(e) {
      return logError("robots", e);
    }

  })(),

  // markup info 
  // Used by: Markup
  'markup': (() => {     
    // https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features
    // Array.from(document.querySelectorAll('dfn[data-dfn-type] code')).map(e => e.innerText).join(',')
    let result = {deprecatedElements: {}};
    let deprecatedNodes = [...document.querySelectorAll('applet,acronym,bgsound,dir,noframes,isindex,keygen,listing,menuitem,nextid,noembed,plaintext,rb,rtc,strike,xmp,basefont,big,blink,center,font,multicol,nobr,spacer,tt,frameset,frame')];

    deprecatedNodes.forEach((n) => {
      let t = n.tagName.toLowerCase();
        if (result.deprecatedElements[t])
          result.deprecatedElements[t]++;
        else
          result.deprecatedElements[t] = 1;
    });



    return result;
  })(),

  // svg use
  // Used by Markup
  'svgs': (() => {   
    try {   
      let result = {};

      result.svg_element_total = document.querySelectorAll('svg').length;
      result.svg_img_total = document.querySelectorAll('img[src*=".svg"]').length;
      result.svg_object_total = document.querySelectorAll('object[data*=".svg"]').length;
      result.svg_embed_total = document.querySelectorAll('embed[src*=".svg"]').length;
      result.svg_iframe_total = document.querySelectorAll('iframe[src*=".svg"]').length;

      result.svg_total = result.svg_element_total+result.svg_img_total+result.svg_object_total+result.svg_embed_total+result.svg_iframe_total;

      return result;
    }
    catch(e) {
      return logError("svgs", e);
    }
  })(),

    // app
      // Used by Markup
  'app': (() => {   
    try {   
      let result = {};

      
      //  `<div id="app">` 
      result.app_id_present = !!document.getElementById("app");

      // `<meta name="theme-color">` 
      result.meta_theme_color_present = !!document.querySelector('meta[name="theme-color"]');

      return result;
    }
    catch(e) {
      return logError("svgs", e);
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

    // visible word count
  // Used by: SEO
  'visible_words': (() => {

    let result = {
      rendered: document.body?.innerText?.match(/\S+/g)?.length, // \S+ matches none whitespace, which would be a word
    };

    var rawDiv = getRawHtmlDiv();

    if (rawDiv) {
      document.body.appendChild(rawDiv); // i think this removes the head section from the raw page. So do this last. needed so it can work out whats visible

      result.raw = rawDiv.innerText?.match(/\S+/g)?.length;

      document.body.removeChild(rawDiv);
    }

    return result;
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
if (logs.length > 0) {
  almanac.log = logs;
}

// for some reason we return the string. Maybe to make it easier for usin in BigQuery
return JSON.stringify(almanac);
