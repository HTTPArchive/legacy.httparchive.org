//[robots_txt]

// Extracts status, size, overall record count, and record counts respective to user-agents.

/*
Example Output:
{
  "redirected": false,
  "status": 200,
  "size": 2279,
  "size_kib": 2.2255859375,
  "over_google_limit": false,
  "comment_count": 19,
  "record_counts": {
    "by_type": {
      "sitemap": 0,
      "user_agent": 1,
      "allow": 32,
      "disallow": 36,
      "crawl_delay": 1,
      "noindex": 0,
      "other": 0
    },
    "by_useragent": {
      "*": {
        "allow": 32,
        "disallow": 36,
        "crawl_delay": 1,
        "noindex": 0,
        "other": 0
      }
    }
  }
}
*/

const fetchWithTimeout = (url) => {
  var controller = new AbortController();
  setTimeout(() => {controller.abort()}, 5000);
  return fetch(url, {signal: controller.signal});
}

const RECORD_COUNT_TYPES = {
    'sitemap': 'sitemap',
    'user-agent': 'user_agent',
    'allow': 'allow',
    'disallow': 'disallow',
    'crawl-delay': 'crawl_delay',
    'noindex': 'noindex',
    'other': 'other'
};

const BY_USERAGENT_TYPES = {
    'allow': 'allow',
    'disallow': 'disallow',
    'crawl-delay': 'crawl_delay',
    'noindex': 'noindex',
    'other': 'other'
};

const parseRecords = (text)=>{

    const cleanLines = (r)=>r.replace(/(\s+|^\s*)#.*$/gm, '').trim().toLowerCase();
    const splitOnLines = (r)=>r.split(/[\r\n]+/g).filter((e)=>e.length > 0);
    const lines = splitOnLines(cleanLines(text));

    const rec_types = Object.keys(RECORD_COUNT_TYPES).join('|');
    const regex = new RegExp(`(${rec_types})(?=\\s*:)`,'gi');

    const records = [].map.call(lines, line=>{

        let rec_match = line.match(regex);

        if (rec_match) {
            return {
                record_type: rec_match[0].trim(),
                record_value: line.slice(line.indexOf(':') + 1).trim()
            };
        }

        return {
            record_type: 'other',
            record_value: line
        };

    }
    );

    return records;
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
      result.over_google_limit = result.size_kib > 500;
      result.comment_count = t.match(/(\s+|^\s*)#.*$/gm)?.length ?? 0;
      result.record_counts = {};

      // Parse Records to clean objects
      const records = parseRecords(t);

      // Record counts by type of record
      result.record_counts.by_type = {};
      for (let rec_type of Object.keys(RECORD_COUNT_TYPES)) {
          result.record_counts.by_type[RECORD_COUNT_TYPES[rec_type]] = records.filter((e)=>e['record_type'] == rec_type).length;
      }

      // Record counts by user-agent
      counts_by_useragent = {};
      var applies_to_useragent = [];
      var last = null;

      for (let record of records) {

          if (record.record_type == 'user-agent') {

              // If empty build 
              if (!(record.record_value in counts_by_useragent)) {
                  counts_by_useragent[record.record_value] = Object.values(BY_USERAGENT_TYPES).reduce((a,v)=>({
                      ...a,
                      [v]: 0
                  }), {});
              }

              // If prior record UA, append to list, else create list of 1.
              if (last == 'user-agent') {
                  applies_to_useragent.push(record.record_value);
              } else {
                  applies_to_useragent = [record.record_value];
              }

          } else if (record.record_type in BY_USERAGENT_TYPES) {
              for (ua of applies_to_useragent) {
                  counts_by_useragent[ua][BY_USERAGENT_TYPES[record.record_type]] += 1;
              }

          }

          last = record.record_type;

      }

      result.record_counts.by_useragent = counts_by_useragent;

      return JSON.stringify(result); 
    });        
  })
  .catch(error => {
    return JSON.stringify({message: error.message, error: error});
  });
