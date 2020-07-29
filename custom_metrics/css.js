//[css]
// Uncomment the previous line for testing on webpagetest.org

return JSON.stringify({
  'css_in_js': (() => {
    const CssInJsMap = {
      'Styled Components': !!document.querySelector('style[data-styled],style[data-styled-components]'),
      'Radium': !!document.querySelector('[data-radium]'),
      'React JSS': !!document.querySelector('[data-jss]'),
      'Emotion': !!document.querySelector('[data-emotion]'),
      'Goober': !!document.getElementById('_goober'),
      'Merge Styles': !!document.querySelector('[data-merge-styles]'),
      'Styled Jsx': !!document.querySelector('style[id*="__jsx-"]'),
      'Aphrodite': !!document.querySelector('[data-aphrodite]'),
      'Fela': !!document.querySelector('[data-fela-stylesheet]'),
      'Styletron': !!document.querySelector('[data-styletron],._styletron_hydrate_'),
      'React Native for Web': !!document.querySelector('#react-native-stylesheet'),
      'Glamor': !!document.querySelector('[data-glamor]')
    }

    const usedLibraries = []
    for (l in CssInJsMap) {
      if (CssInJsMap[l]) {
        usedLibraries.push(l);
      }
    }

    return usedLibraries;
  })()
});
