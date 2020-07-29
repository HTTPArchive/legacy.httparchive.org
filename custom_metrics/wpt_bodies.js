//[wpt_bodies]
// Uncomment the previous line for testing on webpagetest.org

// Instructions for adding a new custom metric are in almanac.js.

// output size ~ 5k to 10k
// note for the a test where this outputting 8k, almanac.js outputted 34k

var _logs = [];
// saves the error details in the results log property.
// returns the same error object so that it can be also used as the return value for a property.
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

  _logs.push(error);

  return error;
}

var _custom_metrics = null;

try { // whole process is placed in a try/catch so we can log uncaught errors

  // this provides access to a lot of WebPageTest data, including the raw html, headers and other requests involved
  var _wptBodies = [];
  try {
    _wptBodies = $WPT_BODIES; 
  }
  catch (e) {
    logError("wptBodies", "Data returned was not valid", e);
  }

  // string of the raw html
  let _rawHtml = null;
  function getRawHtml() {
    if (!_rawHtml && _wptBodies.length > 0) {  
      _rawHtml = _wptBodies[0].response_body;
    }
    return _rawHtml;
  }

  // an html document of the raw html
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

  // the raw html placed in a div. This was needed for a special case where I need to test for content visibility. I temporarily add the div to the rendered page so that it can calculate things. 
  // Note that it seems the head is removed from this version, so it does not work for gathering meta data etc.
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

  // returns an array of matching response headers
  function getResponseHeaders(name) {
    return _wptBodies[0]?.response_headers[name]?.split("\n");
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

  // to help properties share information
  var renderedPrimaryTitle = null;
  var rawPrimaryTitle = null;

  _custom_metrics = {
    // gather the status code from the headers
    // Backup: available from summery table
    'http_status_code': (() => {
      try {
        let statusArray = getResponseHeaders('status');

        if (statusArray)
          return statusArray[0];

        return null;
      }
      catch(e) {
        return logError("http_status_code", e);
      }
    })(),
    // Looks at links and identifies internal, external or hashed as well as rel attributes and if a link is image only
    // Used by: SEO, 2019/09_10 
    // Backup: old version in almanac.js - does not detect same domain
    'anchors': (() => {
      try {   
        // area tags are also a form of link

        let link = document.createElement('a');
        let location = document.location;

        function getAnchorData(d) {

          let nodes = d.getElementsByTagName('a');

          let hostname = location.hostname;

          let protocol = "";

          let target = {
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
                  target.hash_only_link++;
                } else if (node.getAttribute("href").includes("#")) {
                  target.hash_link++;
                }

                protocol = link.protocol.replace(":", "").toLowerCase();

                if (target.protocols[protocol]) 
                  target.protocols[protocol]++;
                else 
                  target.protocols[protocol] = 1;

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
                    target.same_page.total++;
                    if (link.href.includes("void")) {
                      target.javascript_void_links++;
                    }
                    break; 
                  default:
                    samePage = true;
                    target.same_page.total++;
                    break;     
                }
                if (!samePage) { // was not set by protocol
                  if (hostname === link.hostname) {
                    
                    if (location.pathname === link.pathname) {
                      // same page
                      target.same_page.total++;
                      samePage = true; 
                    }
                    else {
                      // same site
                      target.same_site++;
                      dealtWith = true;
                    }
                  }
                  else {
                    if (hostname.endsWith('.'+link.hostname) || link.hostname.endsWith('.'+hostname)) {
                      // same property 
                      target.same_property++;
                      dealtWith = true;
                    }
                    else {
                        // other property
                        target.other_property++;
                        dealtWith = true;
                    }
                  }
                }

                if (samePage && link.hash.length > 1) { // >1 so not it include # only
                  hashBased = true;
                  crawlable = false;
                  let id = link.hash.substring(1);
                  if (d.getElementById(id)) { // matching id
                    // working named anchor link
                    target.same_page.jumpto.total++;
                    target.same_page.jumpto.using_id++;
                    dealtWith = true;

                    if (index <= 3) {
                      target.same_page.jumpto.early++;
                    } else {
                      target.same_page.jumpto.other++;
                    }

                  } else if (d.querySelector("*[name='"+id+"']")) { // then try matching name
                    // working named anchor link
                    target.same_page.jumpto.total++;
                    target.same_page.jumpto.using_name++;
                    dealtWith = true;

                    if (index <= 3) {
                      target.same_page.jumpto.early++;
                    } else {
                      target.same_page.jumpto.other++;
                    }

                  }
                  //else // # link with no clue

                }
                //else // link to self           
      
              }
              else {
                // no href so class as same page
                target.same_page.total++;
              }

              // ok
              if (!dealtWith) {
                // still not worked out what it does. dynamic or other is left

              // https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/seo/crawlable-anchors.js


                let dynamic = false;

                if (node.hasAttribute("onclick"))
                {
                  dynamic = true;
                  target.same_page.dynamic.onclick_attributes.total++;

                  let onclick = node.getAttribute("onclick");
                  
                  if (onclick.includes("window.location")) {
                    target.same_page.dynamic.onclick_attributes.window_location++;
                  } else if (onclick.includes("window.open")) {
                    target.same_page.dynamic.onclick_attributes.window_open++;
                  }
                  else {
                    target.same_page.dynamic.onclick_attributes.unknown_action++;
                  }           
                }

                if (protocol.trim().toLowerCase() === "javascript") {
                  target.same_page.dynamic.href_javascript++;
                  dynamic = true;
                }

                // click based listeners?

                if (dynamic) {
                  if (hashBased) {
                    target.same_page.dynamic.hash_link++;
                  }
                  target.same_page.dynamic.total++;
                }
                else {
                  target.same_page.other.total++;
                  if (hashBased) {
                    target.same_page.other.hash_link++;
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
                                target.rel_attributes.nofollow++;
                                follow = false;
                                break;
                              case "dofollow":
                                target.rel_attributes.dofollow++;
                                break;
                              case "follow":
                                target.rel_attributes.follow++;
                                break;
                              case "ugc":
                                target.rel_attributes.ugc++;
                                follow = false;
                                break;
                              case "sponsored":
                                target.rel_attributes.sponsored++;
                                follow = false;
                                break;
                              case "noopener":
                                target.rel_attributes.noopener++;
                                current_noopener = true;
                                break;
                              case "noreferrer":
                                target.rel_attributes.noreferrer++;
                                current_noreferrer = true;
                                break;
                          }
                      });
                  });
              }

              if (node.target) {
                let targetAttribute = node.target.trim();


                if (targetAttribute == "_blank") {
                  target.target_blank.total++;

                  if (current_noopener && current_noreferrer) {
                    target.target_blank.noopener_noreferrer++;
                  } else if (current_noopener) {
                    target.target_blank.noopener++;
                  } else if (current_noreferrer) {
                    target.target_blank.noreferrer++;
                  } else {
                    target.target_blank.neither++;
                  }
                }

                if (target.targets[targetAttribute]) 
                  target.targets[targetAttribute]++;
                else 
                  target.targets[targetAttribute] = 1;
              }

              // see if it is an image link
              // no visible text
              let noText = node.innerText.trim().length === 0;
              let hasImage = node.querySelector('img') !== null;

              if (noText) {
                  if (hasImage) {
                    target.image_links++;
                  }
                  else {
                      // invisible link? 
                      target.invisible_links++;
                  }
              }
              else {
                target.text_links++;
              }

              if (crawlable) { // unless nofollow ???
                if (follow) {
                  target.crawlable.follow++;
                } else
                {
                  target.crawlable.nofollow++;
                }
              }

            });
          }
          return target;
        };

        let result = {};

        result.rendered = getAnchorData(document)

        let rawHtmlDocument = getRawHtmlDocument();

        if (rawHtmlDocument) {
          result.raw = getAnchorData(rawHtmlDocument);
        }

        return result;
      }
      catch(e) {
        return logError("anchors", e);
      }
    })(),


    // Extract the real title tag contents  
    // Used by: SEO
    // Backup: old version in almanac.js 
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

              let snippet = text;

              if (snippet.length > 200) {
                snippet = snippet.substring(0,200) + "...";
              }

              target.primary = {
                characters: characters,
                words: words,
                text: snippet
              };
            }
            return {characters, words };
          }).length;

          return target;
        }

        result.rendered = getTitles(document);

        let rawHtmlDocument = getRawHtmlDocument();

        if (rawHtmlDocument) {
          result.raw = getTitles(rawHtmlDocument);
        }

        if (rawPrimaryTitle !== null) {
          result.title_changed_on_render = renderedPrimaryTitle != rawPrimaryTitle;
        }

        return result; 
      }
      catch(e) {
        return logError("title", e);
      }
    })(),

    // Extract the real meta description tag contents  
    // Used by: SEO
    // Backup: meta nodes in almanac.js 
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
    // Backup: link nodes in almanac.js 
    'hreflangs': (() => {
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
            let matches = h.matchAll(/hreflang=['"]?([^"',]*)/gi);

            for (const match of matches) {
              let c =match[1];
              result.http_header.values.push(c);
            }  
          })
        }

        return result; 
      }
      catch(e) {
        return logError("hreflangs", e);
      }
    })(),

    // heading information from H1 to H8 
    // Used by: SEO, Markup
    // Backup: heading order and length of h1s in almanac.js - not much
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

    // Structured Data use
    // Used by: SEO
    // Backup: old data in almanac.js - not very good
    'structured_data': (() => {  
      try { 
        var link = document.createElement('a'); // Maybe new URL will be neater?

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

            if (items['sameAs']) { // should really check for context based entry as well.
              // could be a string or an array

              let sameAs = items['sameAs'];

              if (typeof sameAs === 'string') {
                if (!target.same_as_values.includes(sameAs)) {
                  target.same_as_values.push(sameAs);
                }
              } else if (sameAs instanceof Array) {
                sameAs.forEach((s) => {
                  if (!target.same_as_values.includes(s)) {
                    target.same_as_values.push(s);
                  }
                })
              }             
            }
            
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
            same_as_values: [],
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
                let cleanText = e.textContent.trim();
                cleanText = cleanText.replace(/^\/\*(.*?)\*\//g, ''); // remove * comment from start (could be for CDATA section) does not deal with multi line comments
                cleanText = cleanText.replace(/\/\*(.*?)\*\/$/g, ''); // remove * comment from end (could be for CDATA section) does not deal with multi line comments

                nestedJsonldLookup(target, jsonldIds, JSON.parse(cleanText), 0, "http://no-context.com/");
                return false; // its good
              }
              catch(e) {
                return true; // its bad
              }
            }).length
          };

          // microdata
          let microdataNodes = d.querySelectorAll('[itemtype]');
          for (let i = 0, len = microdataNodes.length; i < len; i++) {
            let node = microdataNodes[i];

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

          let sameAsNodes = [...d.querySelectorAll('[itemprop="sameAs"]')];

          sameAsNodes.forEach((n) => {
            let href = n.getAttribute('href'); 

            if (href) {
              if (!target.same_as_values.includes(href)) {
                target.same_as_values.push(href);
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

        let result = {};
        result.rendered = gatherStructuredData(document);

        let rawHtmlDocument = getRawHtmlDocument();

        if (rawHtmlDocument) {
          result.raw = gatherStructuredData(rawHtmlDocument);
        }
        
        return result; 
      }
      catch(e) {
        return logError("structured_data", e);
      }
    })(),

    // data from the original html
    // Used by: SEO, Markup  
    // Backup: queiries on the body - expensive
    'raw_html': (() => {  
      try {
        let result = {};

        let rawHtml = getRawHtml();

        if (rawHtml) {

          result.body = !!rawHtml.match(/<body/gi);
          result.html = !!rawHtml.match(/<html/gi);
          result.head = !!rawHtml.match(/<head/gi);
          result.size = rawHtml.length;

          let headmatch = rawHtml.match(/<head.*<\/head>/gsi); // s = match newlines

          if (headmatch) {
            result.head_size = headmatch[0].length;
          }

          let bodymatch = rawHtml.match(/<body.*<\/body>/gsi); // s = match newlines

          if (bodymatch) {
            result.body_size = bodymatch[0].length;
          }

          let commentMatches = rawHtml.match(/<!--/g);

          if (commentMatches) {
            result.comment_count = commentMatches.length;
          }

          let ifCommentMatches = rawHtml.match(/<!-- *\[ *if/gsi);

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
    // canonicals used in the page and http header
    // Used by: SEO
    // Backup: link nodes in almanac.js
    'canonicals': (() => {
      try {
        function processCanonical(c) {
          if (c === result.url) 
            result.self_canonical = true;
          else 
            result.other_canonical = true;

          if (!result.canonicals.includes(c)) 
            result.canonicals.push(c);
        }

        let result = {rendered: {}, raw: {}, self_canonical: false, other_canonical: false, canonicals: []};
        result.url = document.location.href.split("#")[0];

        // headers
        let canonicalLinkHeaders = [];
          // Link: <https://example.com/page-b>; rel="canonical"
        let linkHeaders = getResponseHeaders("link");
        if (linkHeaders) {
          linkHeaders.forEach((h) => {
            let matches = h.matchAll(/<([^>]*)> *; *rel=['"]?canonical['"]?/gi);

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
        return logError("canonicals", e);
      }
    })(),

    // Calculates robots status per type of robot 
    // Used by: SEO
    // Backup: meta nodes in almanac.js
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
      // visible word count
    // Used by: SEO
    // Backup: seo-words in almanac.js
    'visible_words': (() => {
      try {
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
      }
      catch(e) {
        return logError("visible_words", e);
      }
    })()
  };

}
catch(e) { // probably an un caught exception
  logError("general", "Failed to create the custom metrics object", e);
  _custom_metrics = {};
}

if (!_custom_metrics) { // should not be possible
  _custom_metrics = {};
  logError("general", "custom metrics object was missing");
}

// add any logged errors to the almanac 
if (_logs.length > 0) {
  _custom_metrics.log = _logs;
}

return JSON.stringify(_custom_metrics);
