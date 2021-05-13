const response_bodies = $WPT_BODIES;
const eventNamePattern = /addEventListener\([\'"`](\w+)/g;

return Object.fromEntries(response_bodies.filter(har => {
  return eventNamePattern.test(har.response_body);
}).map(har => {
  const eventNames = Array.from(har.response_body.matchAll(eventNamePattern)).map(match => match[1]);
  return [har.url, eventNames];
}));
