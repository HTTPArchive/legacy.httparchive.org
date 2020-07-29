//[css]
// Uncomment the previous line for testing on webpagetest.org

return JSON.stringify({
  'has_cssinjs_styled_components': !!(document.querySelector('style[data-styled]') || document.querySelector('style[data-styled-components]')),
  'has_cssinjs_radium': !!document.querySelector('[data-radium]'),
  'has_cssinjs_jss': !!document.querySelector('[data-jss]'),
  'has_cssinjs_emotion': !!document.querySelector('[data-emotion]'),
  'has_cssinjs_goober': !!document.getElementById('_goober'),
  'has_cssinjs_merge-styles': !!document.querySelector('[data-merge-styles]'),
  'has_cssinjs_jsx': (() => {
    let hasJSX = false;
    document.querySelectorAll('style').forEach((s) => {
      hasJSX = hasJSX || s.id.indexOf('__jsx-') === 0
    });

    return hasJSX;
  })(),
  'has_cssinjs_aphrodite': !!document.querySelector('[data-aphrodite]'),
  'has_cssinjs_fela': !!document.querySelector('[data-fela-stylesheet]'),
  'has_cssinjs_styletron': !!document.querySelector('[data-styletron]') || !!document.querySelector('._styletron_hydrate_'),
  'has_cssinjs_react-native-web': !!document.querySelector('#react-native-stylesheet'),
  'has_cssinjs_glamor': !!document.querySelector('[data-glamor]')
});
