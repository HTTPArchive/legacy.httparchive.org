return JSON.stringify(Array.from(document.querySelectorAll('img[loading]')).map(img => {
  return img.getAttribute('loading').toLowerCase();
}));
