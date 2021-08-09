// [prefersColorScheme]

const PREFERS_COLOR_SCHEME_REGEXP =
  /@media\s+\(\s*prefers-color-scheme\s*:\s*(?:dark|light)\s*\)\s*\{[^\}]*\}/gms;
  
const bodies = $WPT_BODIES;

// Checks in three passes:
// 1. The CSS rules of same-origin and inlined stylesheets in `try {}`.
// 2. The CSS rules of cross-origin stylesheets in `catch {}`.
// 3. The `link[media]` attribute of conditionally loaded stylesheets in the
//    ternary expression if step 1. and step 2. both return `false`.

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
              // Accessing `.cssText` throws for cross-origin stylesheets.
              .map((cssRule) => cssRule.cssText)
              .join('\n'),
          )
            ? true
            : false;
        } catch {
          // Because of CORS, we can't access the cross-origin stylesheets' CSS
          // rules and may end up with an exception here, but we can fall back
          // to parsing the $WPT_BODIES array.
          return (
              // For all stylesheets…
              bodies.filter((request) => request.type === 'Stylesheet')
              // …check if the `prefers-color-scheme` RegExp matches…
              .map((request) =>
                PREFERS_COLOR_SCHEME_REGEXP.test(request.response_body || ''),
              )
          );
        }
      })
      // If even just one of the stylesheets matches, return `true`.
      .filter((usesPrefersColorScheme) => usesPrefersColorScheme).length > 0 ||
    // If none of the stylesheets match, alternatively check if any of the
    // stylesheet `link`s load conditionally based on `prefers-color-scheme`.
    Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"][media*="prefers-color-scheme"]',
      ),
    ).length > 0,
};
