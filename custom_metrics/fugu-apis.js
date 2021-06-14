const responseBodies = $WPT_BODIES;

// Data created via a little helper spreadsheet:
// https://docs.google.com/spreadsheets/d/1ndxh6sl0fSOLHFlMdSiLPqmGPMDVJqkJFYnQ0Hsmhwo/edit?usp=sharing
const patterns = {
  "Web Bluetooth": {
    regEx: /navigator\.bluetooth\.requestDevice\(/g,
    where: "JavaScript",
  },
  "Web USB": {
    regEx: /navigator\.usb\.requestDevice\(/g,
    where: "JavaScript",
  },
  "Web Share": {
    regEx: /navigator\.share\(/g,
    where: "JavaScript",
  },
  "Web Share (Files)": {
    regEx: /navigator\.canShare\(/g,
    where: "JavaScript",
  },
  "Async Clipboard": {
    regEx: /navigator\.clipboard\.writeText\(/g,
    where: "JavaScript",
  },
  "Async Clipboard (Images)": {
    regEx: /navigator\.clipboard\.write\(/g,
    where: "JavaScript",
  },
  "Contact Picker": {
    regEx: /navigator\.contacts\.select\(/g,
    where: "JavaScript",
  },
  "getInstalledRelatedApps": {
    regEx: /navigator\.getInstalledRelatedApps\(/g,
    where: "JavaScript",
  },
  "Compression Streams": {
    regEx: /new CompressionStream\(/g,
    where: "JavaScript",
  },
  "Periodic Background Sync": {
    regEx: /periodicSync\.register\(/g,
    where: "JavaScript",
  },
  "Badging": {
    regEx: /navigator\.setAppBadge\(/g,
    where: "JavaScript",
  },
  "Shape Detection (Barcodes)": {
    regEx: /new BarcodeDetector\(/g,
    where: "JavaScript",
  },
  "Screen Wake Lock": {
    regEx: /navigator\.wakeLock\.request\(/g,
    where: "JavaScript",
  },
  "Content Index": {
    regEx: /index\.getAll\(/g,
    where: "JavaScript",
  },
  "WebOTP": {
    regEx: /navigator\.credentials\.get\(/g,
    where: "JavaScript",
  },
  "File System Access": {
    regEx: /showOpenFilePicker\(/g,
    where: "JavaScript",
  },
  "Pointer Lock (unadjustedMovement)": {
    regEx: /unadjustedMovement\:/g,
    where: "JavaScript",
  },
  "WebHID": {
    regEx: /navigator\.hid\.requestDevice\(/g,
    where: "JavaScript",
  },
  "WebSerial": {
    regEx: /navigator\.serial\.requestPort\(/g,
    where: "JavaScript",
  },
  "WebNFC": {
    regEx: /new NDEFReader\(/g,
    where: "JavaScript",
  },
  "Run On Login": {
    regEx: /navigator\.runOnOsLogin\.set\(/g,
    where: "JavaScript",
  },
  "WebCodecs": {
    regEx: /new MediaStreamTrackProcessor\(/g,
    where: "JavaScript",
  },
  "Digital Goods": {
    regEx: /getDigitalGoodsService\(/g,
    where: "JavaScript",
  },
  "Idle Detection": {
    regEx: /new IdleDetector\(/g,
    where: "JavaScript",
  },
  "Storage Foundation": {
    regEx: /storageFoundation\.open\(/g,
    where: "JavaScript",
  },
  "Handwriting Recognition": {
    regEx: /navigator\.queryHandwritingRecognizerSupport\(/g,
    where: "JavaScript",
  },
  "Compute Pressure": {
    regEx: /new ComputePressureObserver\(/g,
    where: "JavaScript",
  },
  "Ambient Light Sensor": {
    regEx: /new AmbientLightSensor\(\)/g,
    where: "JavaScript",
  },
  "File Handling": {
    regEx: /launchQueue\.setConsumer\(/g,
    where: "JavaScript",
  },
  "Notification Triggers": {
    regEx: /showTrigger\:/g,
    where: "JavaScript",
  },
  "Local Font Access": {
    regEx: /navigator\.fonts\.query\(\);/g,
    where: "JavaScript",
  },
  "Multi-Screen Window Placement": {
    regEx: /getScreens\(\)/g,
    where: "JavaScript",
  },
  "WebSocketStream": {
    regEx: /new WebSocketStream\(/g,
    where: "JavaScript",
  },
  "WebTransport": {
    regEx: /new WebTransport\(/g,
    where: "JavaScript",
  },
  "Web Share Target": {
    regEx: /"share_target"\:/g,
    where: "Web App Manifest",
  },
  "Web Share Target (Files)": {
    regEx: /"enctype"\: "multipart\/form\-data"/g,
    where: "Web App Manifest",
  },
  "Shortcuts": {
    regEx: /"shortcuts"\:/g,
    where: "Web App Manifest",
  },
  "Declarative Link Capturing": {
    regEx: /"capture_links"\:/g,
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
const checkURLConditions = (where, url) => {
  // If the pattern has to occur in JavaScript, make sure the file name
  // includes either `.js` or `.mjs`.
  if (where === "JavaScript" && /\.m?js/.test(url)) {
    return true;
    // If the pattern has to occur in the Web App Manifest, make sure the file
    // name includes either `.json` or `.webmanifest`.
  } else if (
    where === "Web App Manifest" &&
    (/\.webmanifest/.test(url) || /\.json/.test(url))
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
      if (result[har.url] && !result[har.url].includes(key)) {
        if (checkURLConditions(value.where, har.url)) {
          result[har.url].push(key);
        }
      } else {
        if (checkURLConditions(value.where, har.url)) {
          result[har.url] = [key];
        }
      }
    }
  }
});

return result;
