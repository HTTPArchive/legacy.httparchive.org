//[css]
// Uncomment the previous line for testing on webpagetest.org

return JSON.stringify({
  'css_in_js': (() => {
    const CssInJsMap = {
      'styled-components': !!document.querySelector('style[data-styled],style[data-styled-components]'),
      'radium': !!document.querySelector('[data-radium]'),
      'jss': !!document.querySelector('[data-jss]'),
      'emotion': !!document.querySelector('[data-emotion]'),
      'goober': !!document.getElementById('_goober'),
      'merge-styles': !!document.querySelector('[data-merge-styles]'),
      'jsx': !!document.querySelector('style[id*="__jsx-"]'),
      'aphrodite': !!document.querySelector('[data-aphrodite]'),
      'fela': !!document.querySelector('[data-fela-stylesheet]'),
      'styletron': !!document.querySelector('[data-styletron],._styletron_hydrate_'),
      'react-native-web': !!document.querySelector('#react-native-stylesheet'),
      'glamor': !!document.querySelector('[data-glamor]')
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
