const fs = require('fs');

const patterns = fs.readFileSync('./node_modules/fugu-api-data/patterns.js', {encoding: 'utf-8'});

const script = `
const responseBodies = $WPT_BODIES;

// To avoid to match on, e.g., blog posts that contain the patterns,
// ensure that the file names fulfill certain conditions as a heuristic.
// Note that this leaves a slight risk of excluding inline \`<script>\` elements
// using these APIs from being covered, but usage there is expected to be small
// and we prefer to avoid the risk of false positives.
const checkURLConditions = (where, url, mimeType) => {
  // If the pattern has to occur in JavaScript, make sure the file name
  // includes either \`.js\` or \`.mjs\` and uses a correct-ish MIME type
  // (https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#textjavascript).
  if (
    where === "JavaScript" &&
    /\.m?js/.test(url) &&
    mimeType.toLowerCase().endsWith("script")
  ) {
    return true;
  }
  // If the pattern has to occur in the Web App Manifest, make sure the file
  // name includes either \`.json\` or \`.webmanifest\` and uses a MIME type that
  // ends in "json"
  // (https://w3c.github.io/manifest/#:~:text=file%20extension%3A%20.webmanifest%20or%20.json%3F).
  if (
    where === "Web App Manifest" &&
    /\.webmanifest|\.json/.test(url) &&
    mimeType.toLowerCase().endsWith("json")
  ) {
    return true;
  }
  // Fall-through in all other cases.
  return false;
};

// Iterate over all response bodies and over all patterns and populate the
// result object.
const result = {};
responseBodies.forEach((har) => {
  for (const [key, value] of Object.entries(patterns)) {
    if (value.regEx.test(har.response_body)) {
      // Ignore the optional encoding, e.g.,
      // \`application/manifest+json; charset=utf-8\`.
      const mimeType = har.response_headers["content-type"]
        .split(";")[0]
        .trim();
      if (result[key] && !result[key].includes(har.url)) {
        if (checkURLConditions(value.where, har.url, mimeType)) {
          result[key].push(har.url);
        }
      } else {
        if (checkURLConditions(value.where, har.url, mimeType)) {
          result[key] = [har.url];
        }
      }
    }
  }
});

return result;`;

fs.writeFileSync('./custom_metrics/fugu-apis.js', `// [fugu-apis]\n\n${patterns}${script}`, {encoding: 'utf-8'});
