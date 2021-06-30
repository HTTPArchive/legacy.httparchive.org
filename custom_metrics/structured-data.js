//[structured_data]
// Uncomment the previous line for testing on webpagetest.org

var _logs = [];
// saves the error details in the results log property.
// returns the same error object so that it can be also used as the return value for a property.
function logError(context, messageOrException, exception = null) {
  let error = { type: "error", context: context };

  try {
    if (typeof messageOrException === "string") {
      error.message = messageOrException;
    } else if (messageOrException instanceof Object) {
      error.exception = messageOrException;

      if (messageOrException.message) {
        error.message = messageOrException.message;
      } else {
        error.message = JSON.stringify(
          messageOrException,
          Object.getOwnPropertyNames(messageOrException)
        );
      }
    } else {
      error.message = JSON.stringify(messageOrException);
    }

    if (exception) {
      error.exception = exception;

      if (exception.message) {
        error.message += ": " + exception.message;
      }
    }
  } catch (e) {
    error.message = "logError failed";
    error.exception = e;
  }

  _logs.push(error);

  return error;
}

var _custom_metrics = null;

try {
  // whole process is placed in a try/catch so we can log uncaught errors

  // this provides access to a lot of WebPageTest data, including the raw html, headers and other requests involved
  var _wptBodies = [];
  try {
    _wptBodies = $WPT_BODIES;
  } catch (e) {
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
        _rawHtmlDocument =
          document.implementation.createHTMLDocument("New Document");

        _rawHtmlDocument.documentElement.innerHTML = html;
      }
    }
    return _rawHtmlDocument;
  }

  _custom_metrics = {
    structured_data: (() => {
      try {
        function dumpTagAttributes(tags) {
          return tags.map((tag) => {
            const json_tag = {};
            ["rel", "href", "name", "property", "content"].forEach(
              (attribute) => {
                if (tag.hasAttribute(attribute)) {
                  json_tag[attribute] = tag.getAttribute(attribute);
                }
              }
            );
            return json_tag;
          });
        }

        function getAttributeValues(document, attribute) {
          return [...document.querySelectorAll("[" + attribute + "]")].map(
            (element) => element.getAttribute(attribute)
          );
        }

        function gatherStructuredData(d) {
          let target = {
            jsonld_scripts: [],
            present: {
              json_ld: false,
              microdata: false,
              rdfa: false,
              microformats2: false,
              microformats_classic: false,
              dublin_core: false,
              twitter: false,
              facebook: false,
              opengraph: false,
            },
            microdata_itemtypes: [],
            rdfa_vocabs: [],
            rdfa_prefixes: [],
            rdfa_typeofs: [],
            microformats2_types: [],
            microformats_classic_types: [],
            dublin_core: [],
            twitter: [],
            facebook: [],
            opengraph: [],
          };

          // JSON-LD
          target.jsonld_scripts = [
            ...d.querySelectorAll('script[type="application/ld+json"i]'),
          ].map((script) => script.innerHTML);
          target.present.json_ld = target.jsonld_scripts.length > 0;

          // Microdata
          target.present.microdata =
            d.querySelectorAll("[itemscope],[itemtype],[itemprop]").length > 0;
          target.microdata_itemtypes = [
            ...d.querySelectorAll("[itemtype]"),
          ].map((element) => element.getAttribute("itemtype"));

          // RDFa
          target.present.rdfa =
            d.querySelectorAll(
              "[vocab],[typeof],[property],[resource],[prefix]"
            ).length > 0;
          target.rdfa_vocabs = getAttributeValues(d, "vocab");
          target.rdfa_prefixes = getAttributeValues(d, "prefix");
          target.rdfa_typeofs = getAttributeValues(d, "typeof");

          // microformats2
          [
            "h-adr",
            "h-card",
            "h-entry",
            "h-event",
            "h-feed",
            "h-geo",
            "h-item",
            "h-listing",
            "h-product",
            "h-recipe",
            "h-resume",
            "h-review",
            "h-review-aggregate",
          ].forEach((name) => {
            let items = d.querySelectorAll('[class~="' + name + '" i]');
            if (items.length > 0) {
              target.present.microformats2 = true;
              target.microformats2_types.push({
                name: name,
                count: items.length,
              });
            }
          });

          // Classic Microformats
          [
            "hAtom",
            "hCalendar",
            "hCard",
            "hListing",
            "hMedia",
            "hProduct",
            "hRecipe",
            "hResume",
            "hReview",
            "hReview-aggregate",
            "adr",
          ].forEach((name) => {
            let items = d.querySelectorAll('[class~="' + name + '" i]');
            if (items.length > 0) {
              target.present.microformats_classic = true;
              target.microformats_classic_types.push({
                name: name,
                count: items.length,
              });
            }
          });

          const geoItems = d.querySelectorAll(
            '[class~="geo" i] [class~="latitude" i]'
          );
          if (geoItems.length > 0) {
            target.present.microformats_classic = true;
            target.microformats_classic_types.push({
              name: "geo",
              count: geoItems.length,
            });
          }

          // Dublin Core
          target.dublin_core = dumpTagAttributes([
            ...d.querySelectorAll('meta[name^="dc" i]'),
          ]);
          target.present.dublin_core = target.dublin_core.length > 0;

          // Twitter
          target.twitter = dumpTagAttributes([
            ...d.querySelectorAll('meta[name^="twitter:" i]'),
          ]);
          target.present.twitter = target.twitter.length > 0;

          // Facebook
          target.facebook = dumpTagAttributes([
            ...d.querySelectorAll('meta[property^="fb:" i]'),
          ]);
          target.present.facebook = target.facebook.length > 0;

          // OpenGraph
          target.opengraph = dumpTagAttributes([
            ...d.querySelectorAll('meta[property^="og:" i]'),
          ]);
          target.present.opengraph = target.opengraph.length > 0;

          return target;
        }

        let result = {};
        result.rendered = gatherStructuredData(document);

        let rawHtmlDocument = getRawHtmlDocument();

        if (rawHtmlDocument) {
          result.raw = gatherStructuredData(rawHtmlDocument);
        }

        return result;
      } catch (e) {
        return logError("structured_data", e);
      }
    })(),
  };
} catch (e) {
  // probably an un caught exception
  logError("general", "Failed to create the custom metrics object", e);
  _custom_metrics = {};
}

if (!_custom_metrics) {
  // should not be possible
  _custom_metrics = {};
  logError("general", "custom metrics object was missing");
}

// add any logged errors to the almanac
if (_logs.length > 0) {
  _custom_metrics.log = _logs;
}

return JSON.stringify(_custom_metrics);
