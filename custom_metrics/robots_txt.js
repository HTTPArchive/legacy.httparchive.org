//[robots_txt]
return fetch('/robots.txt')
  .then(r => {
    let result = {};
    result.redirected = !!r.redirected;
    result.status = r.status;  
    return r.text().then(t => {
      result.size = t.length;
      result.comment_lines = t.match(/^\s*#\s*(.*)$/gm)?.length ?? 0;
      result.allow_lines = t.match(/^\s*allow\s*:\s*(.*?)\s*$/gmi)?.length ?? 0;
      result.disallow_lines = t.match(/^\s*disallow\s*:\s*(.*?)\s*$/gmi)?.length ?? 0;

      let userAgentMatches = t.matchAll(/^\s*user-agent\s*:\s*(.*?)\s*$/gmi);
      if (userAgentMatches) {
        result.user_agents = [];

        for (const match of userAgentMatches) {
          let c = match[1];
          result.user_agents.push(c);
        }
      }
      
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
