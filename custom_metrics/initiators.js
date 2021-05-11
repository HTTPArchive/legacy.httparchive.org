const requests = $WPT_REQUESTS;
return requests.reduce((map, request) => {
  const url = request.url;
  let initiator = request.initiator.url;
  if (!initiator) {
    initiator = request.initiator?.stack?.callFrames?.[0]?.url
  }
  map[initiator] = map[initiator] || [];
  map[initiator].push(url);
  return map;
}, {});
