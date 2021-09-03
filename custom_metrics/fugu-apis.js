// [fugu-apis]

const patterns = {
  'WebBluetooth': {
    regEx: /navigator\.bluetooth\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'bluetooth' in navigator)(),
    featureDetection: `(async () => 'bluetooth' in navigator)()`,
    documentation: 'https://web.dev/bluetooth/',
    blinkFeatureID: 1670,
  },
  'WebUSB': {
    regEx: /navigator\.usb\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'usb' in navigator)(),
    featureDetection: `(async () => 'usb' in navigator)()`,
    documentation: 'https://web.dev/usb/',
    blinkFeatureID: 1520,
  },
  'Web Share': {
    regEx: /navigator\.share\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'share' in navigator)(),
    featureDetection: `(async () => 'share' in navigator)()`,
    documentation: 'https://web.dev/web-share/',
    blinkFeatureID: 1501,
  },
  'Web Share (Files)': {
    regEx: /navigator\.canShare\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'canShare' in navigator)(),
    featureDetection: `(async () => 'canShare' in navigator)()`,
    documentation: 'https://web.dev/web-share/',
    blinkFeatureID: 2737,
  },
  'Async Clipboard': {
    regEx: /navigator\.clipboard\.writeText\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'clipboard' in navigator && 'writeText' in navigator.clipboard)(),
    featureDetection: `(async () => 'clipboard' in navigator && 'writeText' in navigator.clipboard)()`,
    documentation: 'https://web.dev/async-clipboard/',
    blinkFeatureID: 2372,
  },
  'Async Clipboard (Images)': {
    regEx: /navigator\.clipboard\.write\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'clipboard' in navigator && 'write' in navigator.clipboard)(),
    featureDetection: `(async () => 'clipboard' in navigator && 'write' in navigator.clipboard)()`,
    documentation: 'https://web.dev/async-clipboard/',
    blinkFeatureID: 2370,
  },
  'Contact Picker': {
    regEx: /navigator\.contacts\.select\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'contacts' in navigator)(),
    featureDetection: `(async () => 'contacts' in navigator)()`,
    documentation: 'https://web.dev/contact-picker/',
    blinkFeatureID: 2993,
  },
  'getInstalledRelatedApps': {
    regEx: /navigator\.getInstalledRelatedApps\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getInstalledRelatedApps' in navigator)(),
    featureDetection: `(async () => 'getInstalledRelatedApps' in navigator)()`,
    documentation: 'https://web.dev/get-installed-related-apps/',
    blinkFeatureID: 1870,
  },
  'Compression Streams': {
    regEx: /new\s+CompressionStream\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'CompressionStream' in self)(),
    featureDetection: `(async () => 'CompressionStream' in self)()`,
    documentation: 'https://wicg.github.io/compression/',
    blinkFeatureID: 3060,
  },
  'Periodic Background Sync': {
    regEx: /periodicSync\.register\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'periodicSync' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'periodicSync' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation: 'https://web.dev/periodic-background-sync/',
    blinkFeatureID: 2931,
  },
  'Badging': {
    regEx: /navigator\.setAppBadge\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'setAppBadge' in navigator)(),
    featureDetection: `(async () => 'setAppBadge' in navigator)()`,
    documentation: 'https://web.dev/badging-api/',
    blinkFeatureID: 2726,
  },
  'Shape Detection (Barcodes)': {
    regEx: /new\s+BarcodeDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'BarcodeDetector' in self)(),
    featureDetection: `(async () => 'BarcodeDetector' in self)()`,
    documentation: 'https://web.dev/shape-detection/',
    blinkFeatureID: 3711,
  },
  'Shape Detection (Faces)': {
    regEx: /new\s+FaceDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'FaceDetector' in self)(),
    featureDetection: `(async () => 'FaceDetector' in self)()`,
    documentation: 'https://web.dev/shape-detection/',
    blinkFeatureID: 3712,
  },
  'Shape Detection (Texts)': {
    regEx: /new\s+TextDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'TextDetector' in self)(),
    featureDetection: `(async () => 'TextDetector' in self)()`,
    documentation: 'https://web.dev/shape-detection/',
    blinkFeatureID: 3713,
  },
  'Screen Wake Lock': {
    regEx: /navigator\.wakeLock\.request\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'wakeLock' in navigator)(),
    featureDetection: `(async () => 'wakeLock' in navigator)()`,
    documentation: 'https://web.dev/wake-lock/',
    blinkFeatureID: 3005,
  },
  'Content Index': {
    regEx: /index\.getAll\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'serviceWorker' in navigator &&
      'index' in
        ((await navigator.serviceWorker?.ready) || self.registration))(),
    featureDetection: `(async () => 'serviceWorker' in navigator && 'index' in (await navigator.serviceWorker?.ready || self.registration))()`,
    documentation: 'https://web.dev/content-indexing-api/',
    blinkFeatureID: 2985,
  },
  'Credential Management': {
    regEx: /navigator\.credentials\.get\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'credentials' in navigator)(),
    featureDetection: `(async () => 'credentials' in navigator)()`,
    documentation:
      'https://developers.google.com/web/updates/2016/04/credential-management-api',
    blinkFeatureID: 960,
  },
  'WebOTP': {
    regEx: /transport\s*\:\s*\[["']sms["']\]/g,
    where: 'JavaScript',
    supported: (async () => 'OTPCredential' in self)(),
    featureDetection: `(async () => 'OTPCredential' in self)()`,
    documentation: 'https://web.dev/web-otp/',
    blinkFeatureID: 2880,
  },
  'File System Access': {
    regEx:
      /showOpenFilePicker\s*\(|showSaveFilePicker\s*\(|showDirectoryPicker\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'showOpenFilePicker' in self)(),
    featureDetection: `(async () => 'showOpenFilePicker' in self)()`,
    documentation: 'https://web.dev/file-system-access/',
    blinkFeatureID: 3340,
  },
  'Pointer Lock (unadjustedMovement)': {
    regEx: /unadjustedMovement\s*\:\s*/g,
    where: 'JavaScript',
    supported: (async () =>
      await (async () => {
        try {
          return !!(await document
            .createElement('p')
            .requestPointerLock({ unadjustedMovement: true }));
        } catch {
          return true;
        }
      })())(),
    featureDetection: `(async () => await (async () => { try { return !!await document.createElement("p").requestPointerLock({ unadjustedMovement: true }) } catch { return true } })())()`,
    documentation: 'https://web.dev/disable-mouse-acceleration/',
    blinkFeatureID: 3027,
  },
  'WebHID': {
    regEx: /navigator\.hid\.requestDevice\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'hid' in navigator)(),
    featureDetection: `(async () => 'hid' in navigator)()`,
    documentation: 'https://web.dev/hid/',
    blinkFeatureID: 2866,
  },
  'WebSerial': {
    regEx: /navigator\.serial\.requestPort\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'serial' in navigator)(),
    featureDetection: `(async () => 'serial' in navigator)()`,
    documentation: 'https://web.dev/serial/',
    blinkFeatureID: 2546,
  },
  'WebNFC': {
    regEx: /new\s+NDEFReader\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'NDEFReader' in self)(),
    featureDetection: `(async () => 'NDEFReader' in self)()`,
    documentation: 'https://web.dev/nfc/',
    blinkFeatureID: 3094,
  },
  'Run On Login': {
    regEx: /navigator\.runOnOsLogin\.set\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'runOnOsLogin' in navigator)(),
    featureDetection: `(async () => 'runOnOsLogin' in navigator)()`,
    documentation:
      'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/RunOnLogin/Explainer.md',
    blinkFeatureID: undefined,
  },
  'WebCodecs': {
    regEx: /new\s+MediaStreamTrackProcessor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'MediaStreamTrackProcessor' in self)(),
    featureDetection: `(async () => 'MediaStreamTrackProcessor' in self)()`,
    documentation: 'https://web.dev/webcodecs/',
    blinkFeatureID: 3728,
  },
  'Digital Goods': {
    regEx: /getDigitalGoodsService\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getDigitalGoodsService' in self)(),
    featureDetection: `(async () => 'getDigitalGoodsService' in self)()`,
    documentation:
      'https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing/',
    blinkFeatureID: 3397,
  },
  'Idle Detection': {
    regEx: /new\s+IdleDetector\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'IdleDetector' in self)(),
    featureDetection: `(async () => 'IdleDetector' in self)()`,
    documentation: 'https://web.dev/idle-detection/',
    blinkFeatureID: 2834,
  },
  'Storage Foundation': {
    regEx: /storageFoundation\.open\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'storageFoundation' in self)(),
    featureDetection: `(async () => 'storageFoundation' in self)()`,
    documentation: 'https://web.dev/storage-foundation/',
    blinkFeatureID: 3822,
  },
  'Handwriting Recognition': {
    regEx: /navigator\.queryHandwritingRecognizerSupport\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'queryHandwritingRecognizerSupport' in navigator)(),
    featureDetection: `(async () => 'queryHandwritingRecognizerSupport' in navigator)()`,
    documentation: 'https://web.dev/handwriting-recognition/',
    blinkFeatureID: 3893,
  },
  'Compute Pressure': {
    regEx: /new\s+ComputePressureObserver\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'ComputePressureObserver' in self)(),
    featureDetection: `(async () => 'ComputePressureObserver' in self)()`,
    documentation: 'https://web.dev/compute-pressure/',
    blinkFeatureID: 3899,
  },
  'Accelerometer': {
    regEx: /new\s+Accelerometer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Accelerometer' in self)(),
    featureDetection: `(async () => 'Accelerometer' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1899,
  },
  'Gyroscope': {
    regEx: /new\s+Gyroscope\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Gyroscope' in self)(),
    featureDetection: `(async () => 'Gyroscope' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1906,
  },
  'Absolute Orientation Sensor': {
    regEx: /new\s+AbsoluteOrientationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'AbsoluteOrientationSensor' in self)(),
    featureDetection: `(async () => 'AbsoluteOrientationSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1900,
  },
  'Relative Orientation Sensor': {
    regEx: /new\s+RelativeOrientationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'RelativeOrientationSensor' in self)(),
    featureDetection: `(async () => 'RelativeOrientationSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 2019,
  },
  'Gravity Sensor': {
    regEx: /new\s+GravitySensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'GravitySensor' in self)(),
    featureDetection: `(async () => 'GravitySensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 3795,
  },
  'Linear Acceleration Sensor': {
    regEx: /new\s+LinearAccelerationSensor\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'LinearAccelerationSensor' in self)(),
    featureDetection: `(async () => 'LinearAccelerationSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 2051,
  },
  'Magnetometer': {
    regEx: /new\s+Magnetometer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'Magnetometer' in self)(),
    featureDetection: `(async () => 'Magnetometer' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1907,
  },
  'Ambient Light Sensor': {
    regEx: /new\s+AmbientLightSensor\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'AmbientLightSensor' in self)(),
    featureDetection: `(async () => 'AmbientLightSensor' in self)()`,
    documentation: 'https://web.dev/generic-sensor/',
    blinkFeatureID: 1901,
  },
  'File Handling': {
    regEx: /launchQueue\.setConsumer\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'launchQueue' in self)(),
    featureDetection: `(async () => 'launchQueue' in self)()`,
    documentation: 'https://web.dev/file-handling/',
    blinkFeatureID: 3875,
  },
  'Notification Triggers': {
    regEx: /showTrigger\s*\:\s*new\s+TimestampTrigger\s*\(/g,
    where: 'JavaScript',
    supported: (async () =>
      'Notification' in self && 'showTrigger' in Notification.prototype)(),
    featureDetection: `(async () => 'Notification' in self && 'showTrigger' in Notification.prototype)()`,
    documentation: 'https://web.dev/notification-triggers/',
    blinkFeatureID: 3017,
  },
  'Local Font Access': {
    regEx: /navigator\.fonts\.query\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'fonts' in navigator)(),
    featureDetection: `(async () => 'fonts' in navigator)()`,
    documentation: 'https://web.dev/local-fonts/',
    blinkFeatureID: 3386,
  },
  'Multi-Screen Window Placement': {
    regEx: /getScreens\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'getScreens' in self)(),
    featureDetection: `(async () => 'getScreens' in self)()`,
    documentation: 'https://web.dev/multi-screen-window-placement/',
    blinkFeatureID: 3388,
  },
  'WebSocketStream': {
    regEx: /new\s+WebSocketStream\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'WebSocketStream' in self)(),
    featureDetection: `(async () => 'WebSocketStream' in self)()`,
    documentation: 'https://web.dev/websocketstream/',
    blinkFeatureID: 3018,
  },
  'WebTransport': {
    regEx: /new\s+WebTransport\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'WebTransport' in self)(),
    featureDetection: `(async () => 'WebTransport' in self)()`,
    documentation: 'https://web.dev/webtransport/',
    blinkFeatureID: 3472,
  },
  'Gamepad': {
    regEx: /navigator\.getGamepads\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'getGamepads' in navigator)(),
    featureDetection: `(async () => 'getGamepads' in navigator)()`,
    documentation: 'https://web.dev/gamepad/',
    blinkFeatureID: 1916,
  },
  'WebGPU': {
    regEx: /navigator\.gpu\.requestAdapter\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'gpu' in navigator)(),
    featureDetection: `(async () => 'gpu' in navigator)()`,
    documentation: 'https://web.dev/webgpu',
    blinkFeatureID: 3888,
  },
  'VirtualKeyboard': {
    regEx: /navigator\.virtualKeyboard/g,
    where: 'JavaScript',
    supported: (async () => 'virtualKeyboard' in navigator)(),
    featureDetection: `(async () => 'virtualKeyboard' in navigator)()`,
    documentation:
      'https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/VirtualKeyboardAPI/explainer.md',
    blinkFeatureID: undefined,
  },
  'EyeDropper': {
    regEx: /new\s+EyeDropper\s*\(\)/g,
    where: 'JavaScript',
    supported: (async () => 'EyeDropper' in self)(),
    featureDetection: `(async () => 'EyeDropper' in self)()`,
    documentation: 'https://github.com/WICG/eyedropper-api/blob/main/README.md',
    blinkFeatureID: undefined,
  },
  'Device Posture': {
    regEx: /navigator\.devicePosture/g,
    where: 'JavaScript',
    supported: (async () => 'devicePosture' in navigator)(),
    featureDetection: `(async () => 'devicePosture' in navigator)()`,
    documentation:
      'https://github.com/w3c/device-posture/blob/gh-pages/README.md',
    blinkFeatureID: undefined,
  },
  'Ink': {
    regEx: /navigator\.ink\.requestPresenter\s*\(/g,
    where: 'JavaScript',
    supported: (async () => 'ink' in navigator)(),
    featureDetection: `(async () => 'ink' in navigator)()`,
    documentation:
      'https://blogs.windows.com/msedgedev/2021/08/18/enhancing-inking-on-the-web/',
    blinkFeatureID: undefined,
  },
  'Window Controls Overlay': {
    regEx: /"window\-controls\-overlay"/g,
    where: 'Web App Manifest',
    supported: (async () => 'windowControlsOverlay' in navigator)(),
    featureDetection: `(async () => 'windowControlsOverlay' in navigator)()`,
    documentation: 'https://web.dev/window-controls-overlay/',
    blinkFeatureID: 3902,
  },
  'Web Share Target': {
    regEx: /"share_target"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/web-share-target/',
    blinkFeatureID: undefined,
  },
  'Web Share Target (Files)': {
    regEx: /"enctype"\s*\:\s*"multipart\/form\-data"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/web-share-target/',
    blinkFeatureID: undefined,
  },
  'Shortcuts': {
    regEx: /"shortcuts"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/app-shortcuts/',
    blinkFeatureID: undefined,
  },
  'Declarative Link Capturing': {
    regEx: /"capture_links"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/declarative-link-capturing/',
    blinkFeatureID: 3813,
  },
  'Tabbed Application Mode': {
    regEx: /"tabbed"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/tabbed-application-mode/',
    blinkFeatureID: undefined,
  },
  'URL Handlers': {
    regEx: /"url_handlers"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/pwa-url-handler/',
    blinkFeatureID: 3851,
  },
  'Protocol Handlers': {
    regEx: /"protocol_handlers"/g,
    where: 'Web App Manifest',
    supported: (async () => undefined)(),
    featureDetection: `(async () => undefined)()`,
    documentation: 'https://web.dev/url-protocol-handler/',
    blinkFeatureID: 3884,
  },
};

const responseBodies = $WPT_BODIES;

// To avoid to match on, e.g., blog posts that contain the patterns,
// ensure that the file names fulfill certain conditions as a heuristic.
// Note that this leaves a slight risk of excluding inline `<script>` elements
// using these APIs from being covered, but usage there is expected to be small
// and we prefer to avoid the risk of false positives.
const checkURLConditions = (where, url, mimeType) => {
  // If the pattern has to occur in JavaScript, make sure the file name
  // includes either `.js` or `.mjs` and uses a correct-ish MIME type
  // (https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#textjavascript).
  if (
    where === "JavaScript" &&
    /.m?js/.test(url) &&
    mimeType.toLowerCase().endsWith("script")
  ) {
    return true;
  }
  // If the pattern has to occur in the Web App Manifest, make sure the file
  // name includes either `.json` or `.webmanifest` and uses a MIME type that
  // ends in "json"
  // (https://w3c.github.io/manifest/#:~:text=file%20extension%3A%20.webmanifest%20or%20.json%3F).
  if (
    where === "Web App Manifest" &&
    /.webmanifest|.json/.test(url) &&
    mimeType.toLowerCase().endsWith("json")
  ) {
    return true;
  }
  // Fall-through in all other cases.
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
      const mimeType = har.response_headers["content-type"]
        .split(";")[0]
        .trim();
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