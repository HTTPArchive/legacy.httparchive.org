// [lazy-in-viewport]
// Uncomment the previous line for testing on webpagetest.org

let images = document.querySelectorAll("img[loading=lazy]");
let lazyImages = [];
images.forEach((img) => {
  if (img.getBoundingClientRect().top < window.innerHeight) {
    lazyImages.push(img.src);
  }
});
return JSON.stringify(lazyImages);
