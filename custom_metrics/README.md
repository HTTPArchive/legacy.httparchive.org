# Web Almanac Custom metrics

## Instructions for adding a custom metric.

HTTP Archive Almanac uses WebPagetest to collect information of webpages.

WebPagetest is able to run arbitrary javascript at the end of a test to coleect custom metrics - [official documentation](https://github.com/WPO-Foundation/webpagetest-docs/blob/master/user/custom_metrics.md).


0. Use existing files or create a new one and add a new key/value pair to the return object.
1. The key should be a unique identifier for the metric, and should be named according to what it's measuring (eg. 'link-nodes').
2. If the value requires more than one line of code, evaluate it in an IIFE, eg `(() => { ... })()`.

```
return JSON.stringify({
  'meta-nodes': (() => {
    // Returns a JSON array of meta nodes and their key/value attributes.
    var nodes = document.querySelectorAll('head meta');
    var metaNodes = parseNodes(nodes);

    return metaNodes;
  })(),
  
  //  check if there is any picture tag containing an img tag
  'has_picture_img': document.querySelectorAll('picture img').length > 0
});
```

3. Test your change by following [the instructions](https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773).

4. Submit a pull request.


## WebPagetest tests debug

Use https://www.webpagetest.org/?debug=1 to run the tests and it will include a raw debug log from the agent including the devtools commands to run the custom metrics (and any handled exceptions).
Log ouput can be found in the main results page to the left of the waterfall. For each run there will be a link for the "debug log" (next to the timeline and trace links).

