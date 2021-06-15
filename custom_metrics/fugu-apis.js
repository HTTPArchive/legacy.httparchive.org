const responseBodies = $WPT_BODIES;

// Data created via a little helper spreadsheet:
// https://docs.google.com/spreadsheets/d/1ndxh6sl0fSOLHFlMdSiLPqmGPMDVJqkJFYnQ0Hsmhwo/edit?usp=sharing.
const patterns = {
  "Web Bluetooth": {
    regEx: /navigator\.bluetooth\.requestDevice\s*\(/g,
    where: "JavaScript",
  },
  "Web USB": {
    regEx: /navigator\.usb\.requestDevice\s*\(/g,
    where: "JavaScript",
  },
  "Web Share": {
    regEx: /navigator\.share\s*\(/g,
    where: "JavaScript",
  },
  "Web Share (Files)": {
    regEx: /navigator\.canShare\s*\(/g,
    where: "JavaScript",
  },
  "Async Clipboard": {
    regEx: /navigator\.clipboard\.writeText\s*\(/g,
    where: "JavaScript",
  },
  "Async Clipboard (Images)": {
    regEx: /navigator\.clipboard\.write\s*\(/g,
    where: "JavaScript",
  },
  "Contact Picker": {
    regEx: /navigator\.contacts\.select\s*\(/g,
    where: "JavaScript",
  },
  "getInstalledRelatedApps": {
    regEx: /navigator\.getInstalledRelatedApps\s*\(/g,
    where: "JavaScript",
  },
  "Compression Streams": {
    regEx: /new CompressionStream\s*\(/g,
    where: "JavaScript",
  },
  "Periodic Background Sync": {
    regEx: /periodicSync\.register\s*\(/g,
    where: "JavaScript",
  },
  "Badging": {
    regEx: /navigator\.setAppBadge\s*\(/g,
    where: "JavaScript",
  },
  "Shape Detection (Barcodes)": {
    regEx: /new BarcodeDetector\s*\(/g,
    where: "JavaScript",
  },
  "Screen Wake Lock": {
    regEx: /navigator\.wakeLock\.request\s*\(/g,
    where: "JavaScript",
  },
  "Content Index": {
    regEx: /index\.getAll\s*\(/g,
    where: "JavaScript",
  },
  "WebOTP": {
    regEx: /navigator\.credentials\.get\s*\(/g,
    where: "JavaScript",
  },
  "File System Access": {
    regEx: /showOpenFilePicker\s*\(/g,
    where: "JavaScript",
  },
  "Pointer Lock (unadjustedMovement)": {
    regEx: /unadjustedMovement\s*\:/g,
    where: "JavaScript",
  },
  "WebHID": {
    regEx: /navigator\.hid\.requestDevice\s*\(/g,
    where: "JavaScript",
  },
  "WebSerial": {
    regEx: /navigator\.serial\.requestPort\s*\(/g,
    where: "JavaScript",
  },
  "WebNFC": {
    regEx: /new NDEFReader\s*\(/g,
    where: "JavaScript",
  },
  "Run On Login": {
    regEx: /navigator\.runOnOsLogin\.set\s*\(/g,
    where: "JavaScript",
  },
  "WebCodecs": {
    regEx: /new MediaStreamTrackProcessor\s*\(/g,
    where: "JavaScript",
  },
  "Digital Goods": {
    regEx: /getDigitalGoodsService\s*\(/g,
    where: "JavaScript",
  },
  "Idle Detection": {
    regEx: /new IdleDetector\s*\(/g,
    where: "JavaScript",
  },
  "Storage Foundation": {
    regEx: /storageFoundation\.open\s*\(/g,
    where: "JavaScript",
  },
  "Handwriting Recognition": {
    regEx: /navigator\.queryHandwritingRecognizerSupport\s*\(/g,
    where: "JavaScript",
  },
  "Compute Pressure": {
    regEx: /new ComputePressureObserver\s*\(/g,
    where: "JavaScript",
  },
  "Ambient Light Sensor": {
    regEx: /new AmbientLightSensor\s*\(\)/g,
    where: "JavaScript",
  },
  "File Handling": {
    regEx: /launchQueue\.setConsumer\s*\(/g,
    where: "JavaScript",
  },
  "Notification Triggers": {
    regEx: /showTrigger\s*\:/g,
    where: "JavaScript",
  },
  "Local Font Access": {
    regEx: /navigator\.fonts\.query\s*\(\);/g,
    where: "JavaScript",
  },
  "Multi-Screen Window Placement": {
    regEx: /getScreens\s*\(\)/g,
    where: "JavaScript",
  },
  "WebSocketStream": {
    regEx: /new WebSocketStream\s*\(/g,
    where: "JavaScript",
  },
  "WebTransport": {
    regEx: /new WebTransport\s*\(/g,
    where: "JavaScript",
  },
  "Web Share Target": {
    regEx: /"share_target"\s*\:/g,
    where: "Web App Manifest",
  },
  "Web Share Target (Files)": {
    regEx: /"enctype"\s*\:\s*"multipart\/form\-data"/g,
    where: "Web App Manifest",
  },
  "Shortcuts": {
    regEx: /"shortcuts"\s*\:/g,
    where: "Web App Manifest",
  },
  "Declarative Link Capturing": {
    regEx: /"capture_links"\s*\:/g,
    where: "Web App Manifest",
  },
  "Tabbed Application Mode": {
    regEx: /"tabbed"/g,
    where: "Web App Manifest",
  },
  "Window Controls Overlay": {
    regEx: /"window\-controls\-overlay"/g,
    where: "Web App Manifest",
  },
  "URL Handlers": {
    regEx: /"url_handlers"/g,
    where: "Web App Manifest",
  },
  "Protocol Handlers": {
    regEx: /"protocol_handlers"/g,
    where: "Web App Manifest",
  },
};

// To make sure we don't match on, e.g., blog posts that contain the patterns,
// make sure that the file names fulfill certain conditions as a heuristic.
const checkURLConditions = (where, url, mimeType) => {
  // If the pattern has to occur in JavaScript, make sure the file name
  // includes either `.js` or `.mjs` and uses a correct-ish MIME type
  // (https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#textjavascript).
  if (
      (where === "JavaScript") &&
      (/\.m?js/.test(url)) &&
      (mimeType.toLowerCase().endsWith('script'))
  ) {
    return true;
    // If the pattern has to occur in the Web App Manifest, make sure the file
    // name includes either `.json` or `.webmanifest` and uses a MIME type that
    // ends in "json"
    // (https://w3c.github.io/manifest/#:~:text=file%20extension%3A%20.webmanifest%20or%20.json%3F).
  } else if (
    (where === "Web App Manifest") &&
    (/\.webmanifest|\.json/.test(url)) &&
    (mimeType.toLowerCase().endsWith('json'))
  ) {
    return true;
  }
  return false;
};

// Iterate over all response bodies and over all patterns and populate the
// result object.
const result = {};
responseBodies.forEach((har) => {
  for (const [key, value] of Object.entries(patterns)) {
    if (value.regEx.test(har.response_body)) {
      // Ignore the optional encoding, e.g.,
      // `application/manifest+json; charset=utf-8`.
      const mimeType = har.response_headers['content-type'].split(';')[0].trim();
      if (result[key] && !result[key].includes(har.url)) {
        if (checkURLConditions(value.where, har.url, mimeType)) {
          result[key].push(har.url);
        }
      } else {
        if (checkURLConditions(value.where, har.url, mimeType)) {
          result[key] = [har.url];
        }
      }
    }
  }
});

return result;
