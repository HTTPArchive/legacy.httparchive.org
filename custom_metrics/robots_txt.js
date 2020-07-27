//[robots_txt]
return fetch('/robots.txt')
  .then(r => {
    let result = {};
    result.redirected = !!r.redirected;
    result.status = r.status;  
    return r.text().then(t => {
      result.size = t.length;
      result.comment_lines = t.match(/^\s*#\s*(.*)$/gm)?.length;
      result.empty_lines = t.match(/^\s*$/gm)?.length;
    //  result.user_agents = t.matchAll(/^\s*user-agent\s*:\s*(.*?)\s*$/gmi)?.map(m => m[1]);
      result.allow_lines = t.match(/^\s*allow\s*:\s*(.*?)\s*$/gmi)?.length;
      result.disallow_lines = t.match(/^\s*disallow\s*:\s*(.*?)\s*$/gmi)?.length;

      let sitemapMatches = t.matchAll(/^\s*sitemap\s*:\s*(.*?)\s*$/gmi);

      if (sitemapMatches) {
        result.sitemaps = [];

        for (const match of sitemapMatches) {
          let c = match[1];
          result.sitemaps.push(c);
        }
      }

      return JSON.stringify(result); 
    });        
  })
  .catch(error => {
    return JSON.stringify({message: error.message, error: error});
  });