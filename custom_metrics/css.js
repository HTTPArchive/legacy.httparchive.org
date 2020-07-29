//[css]
// Uncomment the previous line for testing on webpagetest.org

const CssInJsMap = {
  'styled-components': document => !!document.querySelector('style[data-styled],style[data-styled-components]'),
  'radium': document => !!document.querySelector('[data-radium]'),
  'jss': document => !!document.querySelector('[data-jss]'),
  'emotion': document => !!document.querySelector('[data-emotion]'),
  'goober': document => !!document.getElementById('_goober'),
  'merge-styles': document => !!document.querySelector('[data-merge-styles]'),
  'jsx': document => !!document.querySelector('style[id*="__jsx-"]'),
  'aphrodite': document => !!document.querySelector('[data-aphrodite]'),
  'fela': document => !!document.querySelector('[data-fela-stylesheet]'),
  'styletron': document => !!document.querySelector('[data-styletron],._styletron_hydrate_'),
  'react-native-web': document => !!document.querySelector('#react-native-stylesheet'),
  'glamor': document => !!document.querySelector('[data-glamor]')
}

return JSON.stringify({
  'css_in_js': (() => {
    const usedLibraries = []
    for (l in CssInJsMap) {
      if (CssInJsMap[l](document)) {
        usedLibraries.push(l);
      }
    }

    return usedLibraries;
  })()
});
