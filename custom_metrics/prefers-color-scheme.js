// [prefersColorScheme]

return {
  // Get all stylesheets.
  prefersColorScheme: Array.from(document.styleSheets)
  // For each stylesheet…
  .map((stylesheet) => {
    try {
      // …check if the `prefers-color-scheme` RegExp matches…
      return /@media\s+\(\s*prefers-color-scheme\s*:\s*(?:dark|light)\s*\)\s*\{[^\}]*\}/gms.test(
        // …any of the individual CSS rules.
        Array.from(stylesheet.cssRules)
          .map((cssRule) => cssRule.cssText)
          .join("\n")
      )
        ? true
        : false;
    } catch {
      // Because of CORS, we can't access cross-origin stylesheets' CSS rules.
      return false;
    }
  })
  // If even just one of the stylesheet matches, return `true`.
  .filter((usesPrefersColorScheme) => usesPrefersColorScheme).length > 0,
};
