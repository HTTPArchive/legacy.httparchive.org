//[robots_txt]

const fetchWithTimeout = (url) => {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

const RECORD_TYPES = {
    'user-agent': 'user_agent',
    'allow': 'allow',
    'disallow': 'disallow',
    'crawl-delay': 'crawl_delay',
    'noindex': 'noindex'
}

const parseRecords = (text) => {

    const cleanLines = (r)=>r.replace(/ |#.*$|^\s*sitemap\s*:.*$/gmi, '').trim().toLowerCase();
    const splitOnLines = (r)=>r.split(/[\r\n]+/g).filter((e)=>e.length > 0);
    const lines = splitOnLines(cleanLines(text));

    rec_types = Object.keys(RECORD_TYPES).join('|');
    const regex = new RegExp(`(${rec_types})(?=:)`,'gi');

    const records = [].map.call(lines, line => {

        let rec_match = line.match(regex);

        if (rec_match) {
            return {
                record_type: rec_match[0],
                record_value: line.slice(line.indexOf(':') + 1)
            };
        }

        return {
            record_type: 'error',
            record_value: line
        };

    });

    return records
}


return fetchWithTimeout('/robots.txt')
  .then(r => {
    let result = {};
    result.redirected = !!r.redirected;
    result.status = r.status;  
    return r.text().then(t => {
      
      // Overall Metrics
      result.size = t.length;
      result.size_kib = t.length / 1024;
      result.size_over_google_limit = result.size_kib > 500;

      result.record_counts = {};
      result.record_counts.comment_count = t.match(/#.*$/gm)?.length ?? 0;
      result.record_counts.sitemap_count = t.match(/^\s*sitemap\s*:\s*(.*?)\s*$/gmi)?.length ?? 0;

      const records = parseRecords(t);

      // Overall Record Counts
      result.record_counts.by_type = {};
      for (let rec_type of Object.keys(RECORD_TYPES)) {
          result.record_counts.by_type[RECORD_TYPES[rec_type]] = records.filter((e)=>e['record_type'] == rec_type).length
      }

      // Record counts by user agent
      counts_by_useragent = {};
      var applies_to_useragent = [];
      var last = null;

      for (let record of records) {

          if (record.record_type == 'user-agent') {

              // If empty build 
              if (!(record.record_value in counts_by_useragent)) {
                  counts_by_useragent[record.record_value] = {
                      'allow': 0,
                      'disallow': 0,
                      'noindex': 0,
                      'crawl-delay': 0
                  }
              }

              if (last == 'user-agent') {
                  applies_to_useragent.push(record.record_value);
              } else {
                  applies_to_useragent = [record.record_value]
              }

          } else {

              for (ua of applies_to_useragent) {
                  counts_by_useragent[ua][RECORD_TYPES[record.record_type]] += 1
              }

          }

          last = record.record_type

      }

      result.record_counts.by_useragent = counts_by_useragent;

      return JSON.stringify(result); 
    });        
  })
  .catch(error => {
    return JSON.stringify({message: error.message, error: error});
  });
