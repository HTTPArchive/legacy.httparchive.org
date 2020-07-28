# Instructions for adding a new custom metric for the Web Almanac.

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

3. Test your change by following the instructions at https://github.com/HTTPArchive/almanac.httparchive.org/issues/33#issuecomment-502288773.

4. Submit a pull request.