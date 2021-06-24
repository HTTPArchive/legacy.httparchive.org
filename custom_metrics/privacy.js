//[privacy]
// Uncomment the previous line for testing on webpagetest.org

// README! Instructions for adding a new custom metric for the Web Almanac.
// 2. If the value requires more than one line of code, evaluate it in an IIFE, eg `(() => { ... })()`. See `link-nodes`.
// 3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.
// 4. Submit a PR to update this file.

const response_bodies = $WPT_BODIES;

/**
 * @function findStringInBodies
 * inspired by https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/event-names.js
 *
 * @param {string} string - String to look for in the response bodies.
 * @return {boolean} - True, if string was found.
 */
function findStringInBodies(string) {
  try {
    return response_bodies.some((body) => {
      if (body.response_body) {
        return body.response_body.includes(string);
      } else {
        return false;
      }
    });
  } catch (error) {
    return error.toString();
  }
}

return JSON.stringify({
  /**
   * Privacy policies
   * Wording sourced from: https://github.com/RUB-SysSec/we-value-your-privacy/blob/master/privacy_wording.json:
   * words = privacy_wording.map(country => country.words).filter((v, i, a) => a.indexOf(v) === i).flat().sort().join('|');
   *
   * Test site: https://www.theverge.com/
   */
  privacy_wording_links: (() => {
    var words =
      'adatkezelési|adatvédelem|adatvédelmi|andmekaitsetingimused|aviso legal|beskyttelse af personlige oplysninger|cgu|cgv|confidentialitate|confidentialite|confidentialité|confidentialité|confidentialité|confidentialité|confidentialité|confidențialitate|cookie policy|cookie-uri|cookie-urilor|cookiepolitik|cookies|data policy|data policy|data policy|data policy|datapolicy|datapolitik|datenrichtlinie|datenrichtlinie|datenrichtlinie|datenrichtlinie|datenschutz|datenschutz|datenschutz|datenschutz|datenschutzbestimmungen|datenschutzrichtlinie|donnees personelles|gdpr|gegevensbeleid|gegevensbeleid|gizlilik|gizlilik|integritetspolicy|isikuandmete|isikuandmete töötlemise|kasutustingimused|kişisel verilerin korunması|kolačići|konfidencialiteti|konfidentsiaalsuse|kvkk|küpsised|mbrojtja e të dhënave|mentions légales|mentions légales|normativa sui dati|ochrana dat|ochrana osobních údajů|ochrana osobných údajov|ochrana soukromí|ochrana súkromia|ochrana udaju|ochrana údajov|ochrany osobných údajov|osobné údaje|personlige data|personoplysninger|personuppgifter|personvern|persónuvernd|piškotki|piškotkih|podmínky|policy|politica de utilizare|politika e të dhënave|politikat e privatesise|politikat e privatësisë|politique d’utilisation des données|politique d’utilisation des données|politique d’utilisation des données|politique d’utilisation des données|politique d’utilisation des données|política de dados|política de dados|política de datos|política de datos|pravila o upotrebi podataka|privaatsus|privacidad|privacidad|privacidade|privacidade|privacy|privacy|privacy|privacy|privacy|privacy policy|privacybeleid|privacybeleid|privatezza|privatlivspolitik|privatnost|privatnost|privatnosti|privatssphäre|privatumas|privatumo|privatësia|privātuma|privātums|protecció de dades|protecţia datelor|prywatnosci|prywatności|prywatność|regler om fortrolighed|rekisteriseloste|retningslinjer for data|rgpd|sekretess|slapukai|soukromi|soukromí|személyes adatok védelme|súkromie|sīkdatne|sīkdatņu|tietokäytäntö|tietosuoja|tietosuojakäytäntö|tietosuojaseloste|varstvo podatkov|veri i̇lkesi|veri i̇lkesi|veri politikası|vie privée|webbplatsen|yksityisyyden suoja|yksityisyydensuoja|yksityisyys|zasady dotyczące danych|zasebnost|zaštita podataka|zásady ochrany osobných|zásady používání dat|zásady používání dat|zásady využívania údajov|απόρρητο|απόρρητο|πολιτική απορρήτου|πολιτική δεδομένων|προσωπικά δεδομένα|όροι και γνωστοποιήσεις|конфиденциальность|конфіденційність|поверителност|политика за бисквитки|политика за данни|политика использования данных|политика конфиденциальности|политика о подацима|политика о подацима|политика о подацима|политика обработки персональных данных|приватност|приватност|приватност|условия|условия за ползване|מדיניות נתונים|פרטיות|الخصوصية|سياسة البيانات|数据使用政策|數據使用政策|私隱政策|隐私权政策';
    var pattern = new RegExp(words, 'i');

    return Array.from(document.querySelectorAll('a')).filter((a) =>
      a.innerText.match(pattern)
    ).length;
  })(),

  // Consent Management Platforms

  /**
   * IAB Transparency and Consent Framework v1
   * https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md
   */
  iab_tcf_v1: (() => {
    let consentData;
    // description of `__cmp`: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md#what-api-will-need-to-be-provided-by-the-cmp-
    if (typeof window.__cmp == 'function') {
      // Standard command: 'getVendorConsents'
      // cf. https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/CMP%20JS%20API%20v1.1%20Final.md#what-api-will-need-to-be-provided-by-the-cmp-
      // Test site: ?
      __cmp('getVendorConsents', null, (result, success) => {
        if (success) {
          consentData = result;
          consentData.compliant_setup = true;
        } else {
          // special case for consentmanager ('CMP settings are used that are not compliant with the IAB TCF')
          // see warning at the top of https://help.consentmanager.net/books/cmp/page/changes-to-the-iab-cmp-framework-js-api
          // cf. https://help.consentmanager.net/books/cmp/page/javascript-api
          // Test site: https://www.pokellector.com/
          __cmp('noncompliant_getVendorConsents', null, (result, success) => {
            if (success) {
              consentData = result;
              consentData.compliant_setup = false;
            } else {
              consentData = {error: 'Failed to retrieve consent data'};
            }
          });
        }
      });

      // TODO: could improve to collect 'consent string' data (see next line), but I haven't been able to find a website that still uses v1 to test this
      // __cmp("getConsentData", null, function(v, success) { console.log(v); })
    } else {
      consentData = null;
    }
    return consentData;
  })(),

  /**
   * IAB Transparency and Consent Framework v2
   * docs v2: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2
   *
   * Test site: https://www.rtl.de/
   */
  iab_tcf_v2: (() => {
    let tcData;
    // description of `__tcfapi`: https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#how-does-the-cmp-provide-the-api
    if (typeof window.__tcfapi == 'function') {
      // based on https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#gettcdata
      __tcfapi('getTCData', 2, (result, success) => {
        if (success) {
          tcData = result;
          tcData.compliant_setup = true;
        } else {
          // special case for consentmanager ('CMP settings are used that are not compliant with the IAB TCF')
          // see warning at the top of https://help.consentmanager.net/books/cmp/page/changes-to-the-iab-cmp-framework-js-api
          // cf. https://help.consentmanager.net/books/cmp/page/javascript-api
          // Test site: ?
          __tcfapi('noncompliant_getTCData', 2, (result, success) => {
            if (success) {
              tcData = result;
              tcData.compliant_setup = false;
            } else {
              tcData = {error: 'Failed to retrieve TCData'};
            }
          });
        }
      });
    } else {
      tcData = null;
    }
    return tcData;
  })(),

  /**
   * IAB US Privacy User Signal Mechanism “USP API”
   * https://github.com/InteractiveAdvertisingBureau/USPrivacy
   *
   * Test site: https://www.nfl.com/
   */
  iab_usp: (() => {
    let uspData = {
      present: typeof window.__uspapi == 'function',
      privacy_string: null,
    };
    if (uspData.present) {
      window.__uspapi('getUSPData', 1, (result, success) => {
        if (success) {
          uspData.privacy_string = result;
        }
      });
    }
    return uspData;
  })(),

  /**
   * Ads Transparency Spotlight Data Disclosure schema
   * Only for top frame, can't access child frames (same-origin policy)
   *
   * Test site: unknown
   */
  ads_transparency_spotlight: (() => {
    // Check `meta` tag cf. https://github.com/Ads-Transparency-Spotlight/documentation/blob/main/implement.md
    meta_tag = document.querySelector('meta[name="AdsMetadata"]');
    let ats = {
      present: meta_tag != null,
      ads_metadata: null,
    };
    if (ats.present) {
      ats.ads_metadata = meta_tag.content;
    }
    return ats;
  })(),

  /**
   * FLoC
   * Test site: https://floc-ot-meta.glitch.me/
   * Test site: https://floc.glitch.me/
   *
   * @todo Check function/variable accesses through string searches (wrappers cannot be used, as the metrics are only collected at the end of the test)
   */
  floc: {
    origin_trial: (() => {
      // Check `meta` tag cf. https://developer.chrome.com/blog/floc/ (complement with relevant header later on)
      let floc_meta_tag = document.querySelector(
        'meta[http-equiv="origin-trial"]'
      );
      if (floc_meta_tag) {
        return floc_meta_tag.content; // Get origin trial token, could be useful to check if multiple enrolled sites are from the same webmaster
      } else {
        return null;
      }
    })(),
    document_interestCohort:
      findStringInBodies('document.interestCohort') ||
      findStringInBodies('interestCohort'),
  },

  /**
   * Do Not Track (DNT)
   * https://www.eff.org/issues/do-not-track
   *
   * Test site: https://www.theverge.com/
   */
  navigator_doNotTrack:
    findStringInBodies('navigator.doNotTrack') ||
    findStringInBodies('doNotTrack'),

  /**
   * Global Privacy Control
   * https://globalprivacycontrol.org/
   *
   * Test site: https://global-privacy-control.glitch.me/
   */
  navigator_globalPrivacyControl:
    findStringInBodies('navigator.globalPrivacyControl') ||
    findStringInBodies('globalPrivacyControl'),

  // Sensitive resources

  /**
   * Permissions policy
   * https://www.w3.org/TR/permissions-policy-1/#introspection
   */
  document_permissionsPolicy:
    findStringInBodies('document.permissionsPolicy') ||
    findStringInBodies('permissionsPolicy'),

  // Permissions Policy / Feature Policy on iframes already implemented in `security.js` custom metrics.

  /**
   * Media devices
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
   */
  media_devices: {
    navigator_mediaDevices_enumerateDevices:
      findStringInBodies('navigator.mediaDevices.enumerateDevices') ||
      findStringInBodies('navigator') ||
      findStringInBodies('mediaDevices') ||
      findStringInBodies('enumerateDevices'),
    navigator_mediaDevices_getUserMedia:
      findStringInBodies('navigator.mediaDevices.getUserMedia') ||
      findStringInBodies('navigator') ||
      findStringInBodies('mediaDevices') ||
      findStringInBodies('getUserMedia'),
    navigator_mediaDevices_getDisplayMedia:
      findStringInBodies('navigator.mediaDevices.getDisplayMedia') ||
      findStringInBodies('navigator') ||
      findStringInBodies('mediaDevices') ||
      findStringInBodies('getDisplayMedia'),
  },

  /**
   * Geolocation API
   * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
   */
  geolocation: {
    navigator_geolocation_getCurrentPosition:
      findStringInBodies('navigator.geolocation.getCurrentPosition') ||
      (findStringInBodies('navigator') &&
        findStringInBodies('geolocation') &&
        findStringInBodies('getCurrentPosition')),
    navigator_geolocation_watchPosition:
      findStringInBodies('navigator.geolocation.watchPosition') ||
      (findStringInBodies('navigator') &&
        findStringInBodies('geolocation') &&
        findStringInBodies('watchPosition')),
  },
});
