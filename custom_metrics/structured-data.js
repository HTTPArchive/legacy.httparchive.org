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
        function gatherStructuredData(d) {
          let target = {
            jsonld_scripts: [],
            raw_html: '',
            meta_tags: []
          };

          // JSON-LD
          target.jsonld_scripts = [...d.querySelectorAll('script[type="application/ld+json"i]')].map(script => script.innerHTML)

          // Microdata, RDFa & Microformats
          target.raw_html = d.documentElement.outerHTML;

          // Dublin Core, Twitter, Facebook & OpenGraph
          target.meta_tags = [...d.querySelectorAll('meta')].map(tag => {
            const attributes = tag.getAttributeNames()
            const json_tag = {}
            attributes.map(attribute => {
              json_tag[attribute] = tag.getAttribute(attribute)
            })
            return json_tag
          })

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
