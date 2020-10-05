return JSON.stringify({
  "iframe-allow-sandbox": (() => {
    const link = document.createElement('a');
    return Array.from(document.querySelectorAll('iframe[allow], iframe[sandbox]')).map((iframe) => {
      link.href = iframe.src;
      return {
        "allow": iframe.getAttribute('allow'),
        "sandbox": iframe.getAttribute('sandbox'),
        "hostname": link.origin
      }
    })
  })(),
  "sri-integrity": Array.from(document.querySelectorAll('[integrity]')).map((element) => {
    return {
      "integrity": element.getAttribute('integrity'),
      "src": element.getAttribute('src') || element.getAttribute('href'),
      "tagname": element.tagName.toLowerCase()
    }
  })
});
