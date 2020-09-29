// Calculates the amount of CSS bytes inlined within the document.
return Array.from(document.querySelectorAll('style')).reduce((total, style) => total += style.innerHTML.length, 0);
