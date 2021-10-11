//[markup]
// Uncomment the previous line for testing on webpagetest.org

// Instructions for adding a new custom metric are in almanac.js.

// output size ~ 1.5k to 2k

var _logs = [];
// saves the error details in the results log property.
// returns the same error object so that it can be also used as the return value for a property.
// refactor: https://github.com/HTTPArchive/legacy.httparchive.org/pull/177#discussion_r461970324
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

  _custom_metrics = {
    'favicon': !!document.querySelector('link[rel*="icon"i]'),
    'rel_alternate_mobile': !!document.querySelector('link[rel="alternate"i][media][href]'),
    'compatMode': document.compatMode,

    // noscript tag use
    // Used by SEO, Markup, 2019/09_28
    'noscripts': (() => {   
      try {   
        let result = {iframe_googletagmanager_count: 0};

        var nodes = [...document.querySelectorAll('noscript')];

        result.total = nodes.length;

        nodes.forEach((n) => {
          if (n.innerHTML.match(/googletagmanager\.com/gi)) 
            result.iframe_googletagmanager_count++;
        });

        return result;
      }
      catch(e) {
        return logError("noscripts", e);
      }
    })(),

    // buttons
    // Used by Markup, 2019/09_28
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
        return logError("buttons", e);
      }
    })(),

    // forms
    'form': (() => {   
      try {   
        let result = { target: {}, method: {}, elements: [] };

        var nodes = [...document.querySelectorAll("form")];
        
        result.total = nodes.length;
        
        nodes.forEach((n) => {
          let target = n.getAttribute("target");
        
          if (target) {
            if (result.target[target]) result.target[target]++;
            else result.target[target] = 1;
          }
        
          let method = n.getAttribute("method");
        
          if (method) {
            if (result.method[method]) result.method[method]++;
            else result.method[method] = 1;
          }
        
          var inputs = { tagNames: {}, types: {} };
        
          var elements = [
            ...n.querySelectorAll(
              "input, label, select, textarea, button, fieldset, legend, datalist, output, option, optgroup"
            ),
          ];
        
          elements.forEach((m) => {
            let tagName = m.tagName.toLowerCase();
            
            if (inputs.tagNames[tagName]) {
              inputs.tagNames[tagName]++;
            } else {
              inputs.tagNames[tagName] = 1;
            }
            
            let type = m.getAttribute("type");
        
            if (type) {
              if (inputs.types[type]) {
                inputs.types[type]++;
              } else {
                inputs.types[type] = 1;
              }
            }
          });
        
          result.elements.push({ ...inputs, total: elements.length });
        });              

        return result;
      }
      catch(e) {
        return logError("form", e);
      }
    })(),

    // dir attributes
    // Used by Markup, 2019/09_28
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

    // input tags
    // Used by Markup, 2019/09_28
    // refactor: https://github.com/HTTPArchive/legacy.httparchive.org/pull/177#discussion_r461976290
    // probably not needed as almanac.js covers this
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

        return result;
      }
      catch(e) {
        return logError("inputs", e);
      }
    })(),

    // audio tags
    // Used by Markup
    // refactor: https://github.com/HTTPArchive/legacy.httparchive.org/pull/177#discussion_r461976290
    // or have almanac.js replace it like videos
    'audios': (() => {
      try {
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

        return result;
      }
      catch(e) {
        return logError("audios", e);
      }
    })(),

    // class attribute usage
    // Used by Markup
    'classes': (() => {
      try {
        let result = {unique_names_total: 0, references_total: 0};

        let names = {};

        const nodes = document.querySelectorAll('*[class]');

        nodes.forEach((n) => {
          n.classList.forEach((name) => {
            result.references_total++;

            if (names[name]) {
              names[name]++;
            }
            else {
              names[name] =1;
              result.unique_names_total++;
            }
          });
        });

        return result;
      }
      catch(e) {
        return logError("classes", e);
      }
    })(),

    // id attribute usage
    // Used by Markup
    'ids': (() => {
      try {
        let ids = {};
        let result = {ids_total: 0, duplicate_ids_total: 0, unique_ids_total: 0};

        const nodes = document.querySelectorAll('*[id]');

        nodes.forEach((n) => {

            result.ids_total++;

            if (ids[n.id]) {
              ids[n.id]++;
              result.duplicate_ids_total++;
            }
            else {
              ids[n.id] = 1; 
              result.unique_ids_total++;         
            }
        
        });

        return result;
      }
      catch(e) {
        return logError("ids", e);
      }
    })(),

    // data on img tags including alt, loading, width & height attribute use
    // Used by: SEO, Markup 
    'images': (() => {   
      try { 
        // pictures that contain img and multiple source elements
        // source elements in pictures (media and srcset attributes)

        // img also supports srcset

        // map with area attributes are also links (href, alt). Does google see them? An img references a map via the usemap attribute
  
        let result = {
          picture: {
            total: 0
          },
          source: {
              total: 0,
              src_total: 0,
              srcset_total: 0,
              media_total: 0,
              type_total: 0
          },
          img: {
            total: 0,
            src_total: 0,
            srcset_total: 0,
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
          }
        };

        var pictureNodes = document.querySelectorAll('picture');

        pictureNodes.forEach(node => {
          result.picture.total++;
        });

        var sourceNodes = document.querySelectorAll('source');

        sourceNodes.forEach(node => {
          result.source.total++;
          if (node.hasAttribute("srcset")) {
            result.source.srcset_total++;
          }
          if (node.hasAttribute("src")) {
            result.source.src_total++;
          }
          if (node.hasAttribute("media")) {
            result.source.media_total++;
          }
          if (node.hasAttribute("type")) {
            result.source.type_total++;
          }
        });

        var imgNodes = document.querySelectorAll('img');

        imgNodes.forEach(node => {
            result.img.total++;
            if (node.hasAttribute("srcset")) {
              result.img.srcset_total++;
            }
            if (node.hasAttribute("src")) {
              result.img.src_total++;
            }
            if (node.hasAttribute("alt")) {
                if (node.getAttribute("alt").trim().length > 0) {
                    result.img.alt.present++;
                }
                else {
                    result.img.alt.blank++;
                }
            }
            else {
                result.img.alt.missing++;
            }

            // https://web.dev/native-lazy-loading/
            if (node.hasAttribute("loading")) {
                let val = node.getAttribute("loading").trim().toLowerCase();

                switch (val) {
                    case "auto":
                        result.img.loading.auto++;
                        break;
                    case "lazy":
                        result.img.loading.lazy++;
                        break;
                    case "eager":
                        result.img.loading.eager++;
                        break;
                    case "":
                        result.img.loading.blank++;
                        break;
                    default:
                        result.img.loading.invalid++;
                        break;
                }
            }
            else {
                result.img.loading.missing++;
            }

            if (!node.hasAttribute("width")) result.img.dimensions.missing_width++;
            if (!node.hasAttribute("height")) result.img.dimensions.missing_height++;
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
        return logError("iframes", e);
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
        // < script async src="https://cdn.ampproject.org/v0.js"></ script>
        // boilerplate css

        result.html_amp_attribute_present = !!document.querySelector('html')?.hasAttribute('amp');

        result.html_amp_emoji_attribute_present = !!document.querySelector('html')?.hasAttribute('⚡');

        result.amp_page = result.html_amp_attribute_present || result.html_amp_emoji_attribute_present;

        result.rel_amphtml = document.querySelector("link[rel='amphtml'i]")?.getAttribute('href') ?? null;

        var metadata = document.querySelector("meta[name='generator'i][content^='AMP Plugin'i]");
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
      try {    
        // https://support.google.com/webmasters/answer/79812?hl=en
        // https://developers.google.com/search/reference/robots_meta_tag
        var validNodes = document.querySelectorAll('span[data-nosnippet], div[data-nosnippet], section[data-nosnippet]');
        var allNodes = document.querySelectorAll('[data-nosnippet]');
        return { valid: validNodes.length, wrong_tag_type: allNodes.length - validNodes.length};
      }
      catch(e) {
        return logError("data_nosnippet", e);
      }
    })(),

    // markup info 
    // Used by: Markup
    'obsolete_elements': (() => {  
      try {   
        // https://html.spec.whatwg.org/multipage/obsolete.html#non-conforming-features
        // Array.from(document.querySelectorAll('dfn[data-dfn-type] code')).map(e => e.innerText).join(',')
        let result = {};
        let obsoleteNodes = [...document.querySelectorAll(
          'applet,acronym,bgsound,dir,frame,frameset,noframes,isindex,keygen,listing,menuitem,nextid,noembed,' +
          'plaintext,rb,rtc,strike,xmp,basefont,big,blink,center,font,marquee,multicol,nobr,spacer,tt'
        )];

        obsoleteNodes.forEach((n) => {
          let t = n.tagName.toLowerCase();
            if (result[t])
              result[t]++;
            else
              result[t] = 1;
        });

        return result;
      }
      catch(e) {
        return logError("obsolete_elements", e);
      }
    })(),

    // svg use
    // Used by Markup
    'svgs': (() => {   
      try {   
        let result = {};

        result.svg_element_total = document.querySelectorAll('svg').length;
        result.svg_img_total = document.querySelectorAll('img[src*=".svg"i]').length;
        result.svg_object_total = document.querySelectorAll('object[data*=".svg"i]').length;
        result.svg_embed_total = document.querySelectorAll('embed[src*=".svg"i]').length;
        result.svg_iframe_total = document.querySelectorAll('iframe[src*=".svg"i]').length;

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
        result.meta_theme_color = document.querySelector('meta[name="theme-color"i]')?.getAttribute('content') ?? null;

        return result;
      }
      catch(e) {
        return logError("app", e);
      }
    })()
  };
}
catch(e) { // probably an un caught exception
  logError("general", "Failed to create the custom metrics object", e);
  _custom_metrics = {};
}

// add any logged errors to the almanac 
if (_logs.length > 0) {
  _custom_metrics.log = _logs;
}

return JSON.stringify(_custom_metrics);
