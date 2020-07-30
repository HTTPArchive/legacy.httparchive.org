//[a11y]
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

function incrementCollectorKey(collector, key) {
  if (!collector[key]) {
    collector[key] = 1;
    return;
  }

  collector[key]++;
}

function getJsonReadyError(error) {
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  if (error instanceof Object) {
    const error_obj = {};
    const props = Object.getOwnPropertyNames(error);
    for (const prop of props) {
      error_obj[prop] = error[prop].toString();
    }

    return error_obj;
  }

  return error;
}

function captureAndLogError(fun) {
  try {
    return fun();
  } catch (error) {
    return {
      __error: getJsonReadyError(error),
    }
  }
}

return JSON.stringify({
  tables: captureAndLogError(() => {
    const tables = document.querySelectorAll('table');
    const tables_with_caption = document.querySelectorAll('table caption');

    return {
      total: tables.length,
      total_with_caption: tables_with_caption.length,
    };
  }),
  file_extension_alts: captureAndLogError(() => {
    const elements_with_alt_text = [...document.querySelectorAll('img[alt]')];
    const image_file_extensions = [
      // ICO
      'ico', 'cur',
      // SVG
      'svg', 'svgz',
      // JPG
      'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'pjpeg', 'pjp',
      // APNG
      'apng',
      // PNG
      'png',
      // GIF
      'gif',
      // WEBP
      'webp',
      // TIFF
      'tiff', 'tif',
      // BMP
      'bmp', 'dib',
      // JPEG 2000
      'jp2', 'j2k', 'jpf', 'jpx', 'jpm', 'mj2',
      // HEIF
      'heif', 'heic',
    ];
    const extension_regex = new RegExp(`\.(${image_file_extensions.join('|')})$`, 'i');

    let total_elements_with_non_empty_alt = 0;
    let total_with_file_extension = 0;
    const file_extension_collector = {};
    for (const element of elements_with_alt_text) {
      const alt = element.alt.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
      if (alt.length <= 0) {
        continue;
      }

      const matches = alt.match(extension_regex);
      if (matches && matches[1]) {
        total_with_file_extension++;
        incrementCollectorKey(file_extension_collector, matches[1]);
      }
    }

    return {
      total_elements_with_non_empty_alt,
      total_with_file_extension,
      file_extensions: file_extension_collector,
    };
  }),
  title_and_alt: captureAndLogError(() => {
    const has_both_title_and_alt = document.querySelectorAll('*[title][alt]');

    let total_alt_same_as_title = 0;
    for (const element of has_both_title_and_alt) {
      const title = (element.getAttribute('title') || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
      const alt = (element.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
      if (title === alt) {
        total_alt_same_as_title++;
      }
    }

    return {
      total_alt: document.querySelectorAll('*[alt]').length,
      total_title: document.querySelectorAll('*[title]').length,
      total_both: has_both_title_and_alt.length,
      total_alt_same_as_title,
    };
  }),
  no_destination_anchors: captureAndLogError(() => {
    const href_anchors = [...document.querySelectorAll('a[href]')];

    let total_hash = 0;
    let total_empty = 0;
    let total_javascript_void = 0;
    for (const href_anchor of href_anchors) {
      const href = href_anchor.href.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
      if (href.length <= 0) {
        total_empty++;
      } else if (href === '#') {
        total_hash++;
      } else if (href.indexOf('javascript:void') === 0) {
        total_javascript_void++;
      }
    }

    return {
      total: total_hash + total_empty + total_javascript_void,
      total_hash,
      total_empty,
      total_javascript_void,

      total_with_href: href_anchors.length,
    };
  }),
  th_with_scope_attribute: captureAndLogError(() => {
    const th_elements = document.querySelectorAll('th');
    const th_elements_with_scope = document.querySelectorAll('th[scope]');

    const scope_collector = {};
    for (const element of th_elements_with_scope) {
      let scope = th_elements_with_scope.getAttribute('scope').trim().toLocaleLowerCase();
      incrementCollectorKey(scope_collector, scope);
    }

    return {
      total_th: th_elements.length,
      total_with_scope: th_elements_with_scope.length,
      scopes: scope_collector,
    };
  }),
  td_with_headers_attribute: captureAndLogError(() => {
    return {
      total_tds: document.querySelectorAll('td').length,
      total_with_headers: document.querySelectorAll('td[headers]').length,
    };
  }),
  total_tables_with_role_presentational: captureAndLogError(() => {
    return document.querySelectorAll('table[role="presentation" i]').length;
  }),
  total_anchors_with_role_button: captureAndLogError(() => {
    return document.querySelectorAll('a[role="button" i]').length;
  }),
  total_role_tab_with_selected_and_controls: captureAndLogError(() => {
    return document.querySelectorAll('*[role="tab" i][aria-selected][aria-controls]').length;
  }),
  placeholder_but_no_label: captureAndLogError(() => {
    function controlHasLabel(element) {
      const aria_label = (element.getAttribute('aria-label') || '').trim();
      if (aria_label.trim().length > 0) {
        return true;
      }

      const aria_labelled_by = (element.getAttribute('aria-labelledby') || '').trim();
      if (aria_labelled_by.trim().length > 0) {
        return true;
      }

      // Explicit label
      const id = (element.getAttribute('id') || '').trim;
      if (id.length > 0) {
        const element = document.getElementsByName(id);
        if (element) {
          return true;
        }
      }

      // Implicit label
      if (element.parentElement && element.parentElement.tagName === 'LABEL') {
        return true;
      }

      return false;
    }

    const elements = document.querySelectorAll('input[placeholder], textarea[placeholder], select[placeholder]');
    let total_with_label = 0;
    for (const element of elements) {
      if (controlHasLabel(element)) {
        total_with_label++;
      }
    }

    return {
      total_placeholder: elements.length,
      total_no_label: elements.length - total_with_label,
    };
  }),
  divs_or_spans_as_button_or_link: captureAndLogError(() => {
    const total_role_button = document.querySelectorAll('div[role="button" i], span[role="button" i]').length;
    const total_role_link = document.querySelectorAll('div[role="link" i], span[role="link" i]').length;

    return {
      total_role_button,
      total_role_link,
      total_either: total_role_button + total_role_link,
    };
  }),
  does_page_use_sr_only_classes: captureAndLogError(() => {
    return document.querySelectorAll('.sr-only, .visually-hidden').length;
  }),
});
