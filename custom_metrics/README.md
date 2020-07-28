# Custom metrics

## Instructions for adding a custom metric.

HTTP Archive uses WebPageTest (WPT) to collect information of web pages. WPT is able to run arbitrary JavaScript at the end of a test to coleect custom metrics. See the [WPT custom metrics documentation](https://github.com/WPO-Foundation/webpagetest-docs/blob/master/user/custom_metrics.md) for more info.


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

3. Test your changes on WPT.

4. Submit a pull request. Include one or more links to test results in your PR description to verify that the script is working.

## Testing

To test a custom metric, for example [`doctype.js`](https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/doctype.js), you can enter the script directly on [webpagetest.org](https://webpagetest.org?debug=1) under the "Custom" tab.

![image](https://user-images.githubusercontent.com/1120896/59539351-e3ecdd80-8eca-11e9-8b43-76bbd7a12029.png)

Note that all WPT custom metrics must have `[metricName]` at the start of the script. This is excluded in the HTTP Archive code and generated automatically based on the file name, so you will need to manually ensure that it's set.

If you include the `debug=1` parameter on the WPT home page, for example https://webpagetest.org?debug=1, the test results will include a raw debug log from the agent including the devtools commands to run the custom metrics (and any handled exceptions). The log ouput can be found in the main results page to the left of the waterfall. For each run there will be a link for the "debug log" (next to the timeline and trace links).

To see the custom metric results, select a run and click the "Custom Metrics" link in the top right corner:

![image](https://user-images.githubusercontent.com/1120896/88727164-0e185380-d0fd-11ea-973e-81a50cd24013.png)

![image](https://user-images.githubusercontent.com/1120896/88727208-24beaa80-d0fd-11ea-8ae1-57df2c8505e4.png)

For complex metrics like [almanac.js](./almanac.js) you can more easily explore the results by copy/pasting the JSON into your browser console.
