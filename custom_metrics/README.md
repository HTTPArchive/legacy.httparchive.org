# Custom metrics

## Adding a new custom metric

HTTP Archive uses WebPageTest (WPT) to collect information about how web pages are built. WPT is able to run arbitrary JavaScript at the end of a test to collect specific data, known as custom metrics. See the [WPT custom metrics documentation](https://docs.webpagetest.org/custom-metrics/) for more info.

To add a new custom metric to HTTP Archive:

0. Select the appropriate `js` file. Some custom metrics are small and single-purpose while others return many metrics for a given topic, like [`media.js`](./media.js) and [`almanac.js`](./almanac.js). Create a new file if you're not sure where your script belongs.

1. For scripts that return a JSON object, the key should be named according to what it's measuring, for example `meta-nodes` returns an array of all `<meta>` nodes and their attributes:

```js
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

3. Test your changes on WPT using the workflow below.

4. Submit a pull request. Include one or more links to test results in your PR description to verify that the script is working.

## Testing

To test a custom metric, for example [`doctype.js`](https://github.com/HTTPArchive/legacy.httparchive.org/blob/master/custom_metrics/doctype.js), you can enter the script directly on [webpagetest.org](https://webpagetest.org?debug=1) under the "Custom" tab.

![image](https://user-images.githubusercontent.com/1120896/59539351-e3ecdd80-8eca-11e9-8b43-76bbd7a12029.png)

Note that all WPT custom metrics must have `[metricName]` at the start of the script. This is excluded in the HTTP Archive code and generated automatically based on the file name, so you will need to manually ensure that it's set.

If you include the `debug=1` parameter on the WPT home page, for example https://webpagetest.org?debug=1, the test results will include a raw debug log from the agent including the devtools commands to run the custom metrics (and any handled exceptions). The log ouput can be found in the main results page to the left of the waterfall. For each run there will be a link for the "debug log" (next to the timeline and trace links).

To see the custom metric results, select a run, first click on "Details", and then on the "Custom Metrics" link in the top right corner:

![image](https://user-images.githubusercontent.com/1120896/88727164-0e185380-d0fd-11ea-973e-81a50cd24013.png)

![image](https://user-images.githubusercontent.com/1120896/88727208-24beaa80-d0fd-11ea-8ae1-57df2c8505e4.png)

For complex metrics like [almanac.js](./almanac.js) you can more easily explore the results by copy/pasting the JSON into your browser console.

## Linting

On opening a Pull Request we will do some basic linting of JavaScript using [ESLint](https://eslint.org/) throughn the GitHub Super Linter.

You can run this locally with the following commands:

```sh
docker pull github/super-linter:latest
docker run -e RUN_LOCAL=true -e VALIDATE_JAVASCRIPT_ES=true -e USE_FIND_ALGORITHM=true -v $PWD/custom_metrics:/tmp/lint github/super-linter
```
