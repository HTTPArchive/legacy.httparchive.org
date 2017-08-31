return JSON.stringify(Array.from(document.querySelectorAll('a')).map(a => a.innerText.trim()));
