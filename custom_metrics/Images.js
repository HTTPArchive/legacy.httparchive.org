return new Promise((resolve) => {
  let observer = new IntersectionObserver((entries, observer) => {
    observer.disconnect();
    const images = entries.map((e) => {
      const el = e.target;
      let url = el.currentSrc || el.src;

      // Only include HTTP(S) URLs i.e. skip dataURIs
      if (url.indexOf("http") === 0) {
        return {
          url: url,
          width: el.width,
          height: el.height,
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight,
          loading: el.getAttribute("loading"),
          decoding: el.getAttribute("decoding"),
          inViewport: e.isIntersecting,
        };
      }
    });

    return resolve(JSON.stringify(images));
  });

  const wptImages = (win) => {
    let images = [];
    if (win) {
      const doc = win.document;
      const elements = doc.getElementsByTagName("*");

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.tagName == "IMG") {
          images.push(el);
        }
        if (el.tagName == "IFRAME") {
          try {
            const im = wptImages(el.contentWindow);
            if (im && im.length) {
              images = images.concat(im);
            }
          } catch (e) {}
        }

        if (images.length > 10000) {
          break;
        }
      }
    }

    return images;
  };

  const imgs = wptImages(window);

  if (imgs.length == 0) {
    return resolve([]);
  }
  for (let img of imgs) {
    observer.observe(img);
  }
});
