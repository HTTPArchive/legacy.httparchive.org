// [prefersColorScheme]

const PREFERS_COLOR_SCHEME_REGEXP =
  /@media\s+\(\s*prefers-color-scheme\s*:\s*(?:dark|light)\s*\)\s*\{[^\}]*\}/gms;

return {
  // Get all stylesheets.
  prefersColorScheme:
    Array.from(document.styleSheets)
      // For each stylesheet…
      .map((stylesheet) => {
        try {
          // …check if the `prefers-color-scheme` RegExp matches…
          return PREFERS_COLOR_SCHEME_REGEXP.test(
            // …any of the individual CSS rules.
            Array.from(stylesheet.cssRules)
              .map((cssRule) => cssRule.cssText)
              .join("\n")
          )
            ? true
            : false;
        } catch {
          // Because of CORS, we can't access the cross-origin stylesheets' CSS
          // rules, so purposely potentially under-report as `false`.
          return false;
        }
      })
      // If even just one of the stylesheets matches, return `true`.
      .filter((usesPrefersColorScheme) => usesPrefersColorScheme).length > 0 ||
    // If none of the stylesheets match, alternatively check if any of the
    // stylesheet `link`s load conditionally based on `prefers-color-scheme`.
    Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"][media*="prefers-color-scheme"]'
      )
    ).length > 0,
};
