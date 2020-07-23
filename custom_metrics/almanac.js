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

var wptRequests = [];
try {
    wptRequests = $WPT_REQUESTS; // gets replaced will lots of request response data
}
catch (e) { }

function getResponseHeaders(name) {
  return wptRequests[0]?.response_headers[name]?.split("\n");
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

      var span = document.createElement("SPAN");

      span.innerText = " ["+image.alt.trim()+"] ";

      image.parentNode.insertBefore(span, image.nextSibling);

      tempNodes.push(span);
    }
  }

  let text =  node.innerText.trim();


  tempNodes.forEach(t => t.parentNode.remove(t));

  return text;
}

var primaryTitle = null;

try {

return JSON.stringify({
  // Wether the page contains <script type=module>.
  // Used by 2019/01_12
  '01.12': document.querySelector('script[type=module]') ? 1 : 0,

  // Wether the page contains <script nomodule>.
  // Used by 2019/01_13
  '01.13': document.querySelector('script[nomodule]') ? 1 : 0,

  // Used by SEO, 2019/01,2019/06, 2019/10, 2019/19
  'link-nodes': (() => {
    // Returns a JSON array of link nodes and their key/value attributes
    // Used by 01.14, 01.15, 01.16, 10.6,  06.46, 12.18
    var nodes = document.querySelectorAll('head link');
    var linkNodes = parseNodes(nodes);

    return linkNodes;
  })(),

  // Returns a JSON array of prioritized nodes and their key/value attributes
  // Used by 2019/19_7, 2019/19_8, 2019/19_9, 2019/19_10
  'priority-hints': (() => { 
    var nodes = document.querySelectorAll('link[importance], img[importance], script[importance], iframe[importance]');
    var parsedNodes = parseNodes(nodes);

    return parsedNodes;
  })(),

  // Returns a JSON array of meta nodes and their key/value attributes
  // Used by SEO, 2019/09_28
  'meta-nodes': (() => {     
    var nodes = document.querySelectorAll('head meta');
    var metaNodes = parseNodes(nodes);

    return metaNodes;
  })(),

  // Looks at links and identifies internal, external or hashed as well as rel attributes and if a link is image only
  // Used by: SEO, 2019/09_10 
  'seo-anchor-elements': (() => {
    try {   
      var nodes = document.getElementsByTagName('a');
      var link = document.createElement('a');

      var hostname = document.location.hostname;

      var internal = 0; // metric 10.10
      var external = 0; // metric 10.10
      var externalSameDomain = 0; // metric 10.10
      var externalDifferentDomain = 0; // metric 10.10
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

            if (hostname === link.hostname) {
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
            } else { // if (document.location.hostname !== link.hostname) {
              external++;

              // check if the same domain
              if (hostname.endsWith('.'+link.hostname) || link.hostname.endsWith('.'+hostname)) {
                externalSameDomain++;
              }
              else {
                externalDifferentDomain++;
              }
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

      return { internal, external, externalSameDomain, externalDifferentDomain, hash, navigateHash, earlyHash, nofollow, ugc, sponsored, imageLink };
    }
    catch(e) {
      return {exception: {message: e.message, object: e}};
    }
  })(),

  // Get the html lang attribute if present. Was previously done via SQL which only captured the first two characts of the value (country code)
  // Used by: SEO
  'html-lang': document.querySelector('html')?.getAttribute('lang')?.toLowerCase(),

  // visible word count
  // Used by: SEO
  'visible-words': document.body?.innerText?.match(/\S+/g)?.length, // \S+ matches none whitespace, which would be a word

  // Extract the real title tag contents  
  // Used by: SEO
  'title': (() => {
    try {    
      let result = {};
      result.titleCount = Array.from(document.querySelectorAll('head title')).map(e => {
        let text = e.innerText.trim();
        let characters = text.length;
        let words = text.match(/\S+/g)?.length;

        if (text.length > 0 && !result.primary) {
          primaryTitle = text; // for the heading section

          result.primary = {
            characters: characters,
            words: words
          };
        }
        return {characters: characters, words: words };
      }).length;
      return result; 
    }
    catch(e) {
      return {exception: {message: e.message, object: e}};
    }
  })(),

  // content information including visible words and number of headings
  // Used by: SEO
  'heading': (() => { 
    try {  
      let result = {};

      function processHeading(n) {
        let text = seoText(n);

        let words = text.match(/\S+/g)?.length;

        if (text.length > 0 && !result.primary) {

          result.primary = {
            words: words,
            characters: text.length,
            matchesTitle: text.toLowerCase() == primaryTitle?.toLowerCase()
          }
        }
        return {characters: text.length, words: words ?? 0};
      }
      
      for(let l=1; l < 9; l++) {
        let nodes = Array.from(document.querySelectorAll('h'+l));



        let characters = 0;
        let words = 0;
        // if don't have a primary heading yet, search for one.
        
        var hs = nodes.map(n => {
          let h = processHeading(n);
          characters += h.characters;
          words += h.words;
          return h;
        });
  
        result["h"+l] = {
          count: nodes.length,
          nonEmptyCount: nodes.filter(e => seoText(e).length > 0).length,
          characters: characters,
          words: words
        };
      }
   
      return result; 
    }
    catch(e) {
      return {exception: {message: e.message, object: e}};
    }
  })(),

  // content information including visible words and number of headings
  // Used by: SEO
  'structured-data': (() => {  
    try { 
      var link = document.createElement('a');

      let result = {
        jsonldAndMicrodataTypes: [],
        logo: false,
        siteLinkSearchBox: false,
        itemsByFormat: {
          microformats2: 0,
          microdata: 0,
          jsonld: 0,
          rdfa: 0
        },
        contextHostnames: []
      }

      function nestedJsonldLookup(items, depth, context) {
        if (items instanceof Array) {
          // loop array and process any objects in it 
          for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            if (item instanceof Object) {
              nestedJsonldLookup(item, depth+1, context);
            }
          }
        }
        else if (items instanceof Object) {
          // process object
          result.itemsByFormat.jsonld++;

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

          addType(result.jsonldAndMicrodataTypes, type, true);
 
          // process any properties that have arrays or objects
          var keys = Object.keys(items);
          for (var i = 0, len = keys.length; i < len; i++) {
            var item = items[keys[i]];
            // if array or object, dive into it
            if (keys[i] === "logo") {
              result.logo = true;
            }
            if (item instanceof Object || item instanceof Array) {
              nestedJsonldLookup(item, depth++, context);
            }
          }
        }
      }

      function addType(array, type, jsonld) {
        link.href = type;
        let www = false;
        let name = link.hostname + link.pathname; 

        if (name.startsWith("www.")) {
          www = true;
          name = name.substring("www.".length);
        }

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

        if (!result.contextHostnames.includes(link.hostname)) {
          result.contextHostnames.push(link.hostname);
        }

        if (name === "schema.org/SearchAction") {
          result.siteLinkSearchBox = true;
        }
      }

      // json-ld
      let jsonldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

      result.jsonldScripts = {
        count: jsonldScripts.length,
        errors: jsonldScripts.filter(e => {
          try {
            var cleanText = e.textContent.trim();
            var cleanText = cleanText.replace(/^\/\*(.*?)\*\//g, ''); // remove * comment from start (could be for CDATA section) does not deal with multi line comments
            var cleanText = cleanText.replace(/\/\*(.*?)\*\/$/g, ''); // remove * comment from end (could be for CDATA section) does not deal with multi line comments

            nestedJsonldLookup(JSON.parse(cleanText), 0, "http://no-context.com/");
            return false; // its good
          }
          catch(e) {
            return true; // its bad
          }
        }).length
      };

      // microdata
      var microdataNodes = document.querySelectorAll('[itemtype]');
      for (var i = 0, len = microdataNodes.length; i < len; i++) {
        var node = microdataNodes[i];

        link.href = node.getAttribute('itemtype');

        let type = link.href;

        addType(result.jsonldAndMicrodataTypes, type, false);  

        result.itemsByFormat.microdata++;    
      }

      if (document.querySelector("[itemprop$='logo']")){
        result.logo = true;
      }
       
      if (document.querySelector("[itemtype$='SearchAction']")){
        result.siteLinkSearchBox = true;
      }

      // rdfa
      result.itemsByFormat.rdfa = document.querySelectorAll('[typeof]').length;

      // microformats
      result.microformats2Types = [];
      ["h-adr","h-card","h-entry","h-event","h-feed","h-geo","h-item","h-listing draft","h-product","h-recipe","h-resume","h-review","h-review-aggregate"].forEach(name => {
        let items = document.querySelectorAll('.'+name);
        if (items.length > 0) {
          result.microformats2Types.push({name: name, count: items.length});
          result.itemsByFormat.microformats2 += items.length;
        }
      });
      
      return result; 
    }
    catch(e) {
      return {exception: {message: e.message, object: e}};
    }
  })(),

  // data on img tags including alt, loading, width & height attribute use
  // Used by: SEO  
  'image': (() => {   
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
    }
    catch(e) {
      return {exception: {message: e.message, object: e}};
    }
  })(),

  // amp related data
  // Used by: SEO  
  'amp': (() => {  
    let result = {};

    result.htmlAmpAttributePresent = !!document.querySelector('html')?.hasAttribute('amp');

    result.relAmphtml = document.querySelector("link[rel='amphtml']")?.getAttribute('href') ?? null;

    return result;
  })(),

  // data-nosnippet use 
  // Used by: SEO
  'data-nosnippet': (() => {     
      // https://support.google.com/webmasters/answer/79812?hl=en
      // https://developers.google.com/search/reference/robots_meta_tag
      var validNodes = document.querySelectorAll('span[data-nosnippet], div[data-nosnippet], section[data-nosnippet]');
      var allNodes = document.querySelectorAll('[data-nosnippet]');
      return { valid: validNodes.length, wrongTagType: allNodes.length - validNodes.length};
  })(),

  // Extracts words on the page to flag thin content pages
  // Used by: SEO  (Probably will go)
  'seo-words': (() => {   
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
  // Used by 2019/12*, 2019/09_30b
  'input-elements': (() => {   
    var nodes = document.querySelectorAll('input, select');
    var inputNodes = parseNodes(nodes);

    return inputNodes;
  })(),
  // The first canonical value in the page 
  // Used by: SEO
  'canonical': document.querySelector('link[rel="canonical"]')?.href,

  // Calculates robots status per type of robot 
  // Used by: SEO
  'robots': (() => {
    // https://developers.google.com/search/reference/robots_meta_tag
    let result = {
      x_robots_tag: getResponseHeaders("x-robots-tag"), // array
      hasRobotsMetaTag: false,
      hasXRobotsTag: false
    }

    function processRobotsValue(destination, content) {
      content.split(",").forEach(part => {
        switch(part.split(":")[0].trim().toLowerCase()) {
          case "noindex":
            destination.noindex = true;
            break;
          case "none":
            destination.noindex = true;
            destination.nofollow = true;
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
    function calculateRobots(selector, x_robots_name) {
      let robots = {
        noindex: false,
        nofollow: false,
        noarchive: false,
        nosnippet: false,
        unavailable_after: false,
        max_snippet: false,
        max_image_preview: false,
        max_video_preview: false,
        notranslate: false,
        noimageindex: false,
        nocache: false,
        viaMetaTag: false,
        viaXRobotsTag: false
      };

      Array.from(document.querySelectorAll(selector)).forEach(e => {
        if (e.hasAttribute("content")) {
          let content = e.getAttribute("content");
          robots.viaMetaTag = true;
          result.hasRobotsMetaTag = true;
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
              robots.viaXRobotsTag = true;
              result.hasXRobotsTag = true;
              processRobotsValue(robots, t); // always process
            }

            if (bot === x_robots_name) {
              robots.viaXRobotsTag = true;
              result.hasXRobotsTag = true;
              processRobotsValue(robots, t);
            }
        
        });
      }

      return robots;

    }

    result.otherbot = calculateRobots('meta[name="robots"]', 'otherbot');
    result.googlebot = calculateRobots('meta[name="robots"], meta[name="googlebot"]', 'googlebot');
    result.googlebot_news = calculateRobots('meta[name="robots"], meta[name="googlebot-news"]', 'googlebot-news');

    return result;

  })(),
  // Extract the text of the H1 tag 
  // Used by: SEO
  'h1-text': (() => {
    // We return only the text of the first H1. 
    var h1_text = document.querySelectorAll('h1')[0]?.textContent ?? 'h1 is missing';
    
    return h1_text;
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

  // Gets metadata about the AMP plugin, if present
  // Used by: CMS? 
  'amp-plugin': (() => {
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

}
catch(e) {
  return {exception: {message: e.message, object: e}};
}
