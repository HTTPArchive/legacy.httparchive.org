# JavaScript Library Detection

There's a custom metric to [detect third-party JavaScript libraries](../custom_metrics/third-parties.js) included by
websites. Its signatures are based on [Library Detector](https://github.com/johnmichel/Library-Detector-for-Chrome).
The signatures work by looking for characteristic global variable names and objects in the runtime JavaScript
environment of the browser during the crawl.

## Limitations of the Detection Methodology

* Because the tests must be executed during the crawl, only libraries supported at the time of the crawl can be
  detected. Adding support for additional libraries will detect them only in future crawls, not retroactively.
* In abstract terms, each frame of a website has its own JavaScript environment and could load its own set of libraries.
  However, the crawl executes library detection tests only in the main page - this means that libraries loaded inside
  frames will go undetected.
* Some websites (accidentally or on purpose) include the same library multiple times into the same page. Since libraries
  usually register as a global variable, only one copy can be detected (the one referenced by the variable when the
  tests are run).
* The version of a library is "detected" by extracting the value of the version attribute in the library code. The
  detected version may be incorrect if a website developer modifies the version string, or if the library code returns
  the wrong version number. Some libraries don't have such a version attribute, which means they will be detected as
  present in the website, but with an unknown (`null`) version. Other libraries didn't have a version attribute from the
  start but added it later, which means that older versions of such a library will be detected as an unknown version,
  and more recent versions will be detected as the version number exported by the library.
* Because of the way the library signatures work, there's a higher potential that a detection is a "false positive" when
  no version number could be extracted.
* If a website includes libraries as a "private" reference instead of a global variable, uses heavy minification with
  dead code removal, uses obfuscation, or makes manual modifications to the library code, the signatures might fail to
  detect the library.
