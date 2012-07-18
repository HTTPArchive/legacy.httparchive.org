<?php 
/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

require_once("ui.inc");
require_once("utils.inc");

$gTitle = "News";
?>
<!doctype html>
<html>
<head>	
<title><?php echo genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
<style>
DT { font-weight: bold; margin-top: 20px; }
DD { margin-left: 40px; font-size: 0.9em; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>
<h1><?php echo $gTitle ?></h1>

<dl id=news>
  <dt> June 15, 2012: <a href="http://royal.pingdom.com/2012/06/15/loading-todays-sites-over-dialup/">Want pain? Try loading today’s websites over dial-up</a>
  <dd> Pingdom quotes HTTP Archive page size stats.

  <dt> June 4, 2012: <a href="http://www.igvita.com/2012/06/04/chrome-networking-dns-prefetch-and-tcp-preconnect/">Chrome Networking: DNS Prefetch & TCP Preconnect</a>
  <dd> Ilya Grigorik quotes JavaScripts stats from the HTTP Archive.

  <dt> May 24, 2012: <a href="http://www.webperformancetoday.com/2012/05/24/average-web-page-size-1-mb/">Bad news for site owners and mobile users: The average web page is now 1 MB</a>
  <dd> Joshua Bixby from Strangeloop Networks sites statistics from HTTP Archive about growth of web content.

  <dt> April 28, 2012: <a href="http://www.websiteoptimization.com/speed/tweak/blocking-javascript/">Blocking JavaScript with Web Page Test</a>
  <dd> Cites growth of JavaScript from HTTP Archive.

  <dt> April 19, 2012: <a href="http://royal.pingdom.com/2012/04/19/another-reason-why-its-a-good-thing-flash-is-going-away/">Another reason why it’s a good thing Flash is going away</a>
  <dd> Pingdom blog post about the large size of Flash resources. "HTTP Archive, a project that analyzes thousands of web pages each month to get this statistic and more. It’s a great resource, so check it out if you like technical stats about web pages."

  <dt> April 18, 2012: <a href="http://zoompf.com/blog/2012/04/unsuitable-image-formats-for-websites">Unsuitable Image Formats for Websites</a>
  <dd> Zoompf blog post about less common image formats. "According to the awesome HTTP Archive, the most common image formats on the web are PNG, GIF, and JPEG:". 

  <dt> April 16, 2012: <a href="http://dl.dropbox.com/u/91644/Pages%20vs%20No.%20Resources.png">Pages vs. No. Resources</a>
  <dd> Andy Davies' analysis of data. <a href="https://twitter.com/#!/andydavies/status/192298419765788672">"Did it to validate the 150 resource default of the proposed W3C Resource Timing spec"</a>.

  <dt> April 1, 2012: Number of URLs increased to 100K.

  <dt> January 2012: Migrated httparchive.org to new data center.

  <dt> November 17, 2011: Added the ability for anyone to <a href="http://httparchive.org/addsite.php">add a site</a> to the crawl.

  <dt> November 1, 2011: &#35; of URLs increased; Page Speed version changed
  <dd> Several changes occurred affecting the crawl and long term trends:
<ul>
  <li> WebPagetest upgraded from Page Speed 1.9 to 1.12. 
This caused a noticeable drop in Page Speed scores for some long term trends - both "All" and "intersection" dropped from 82 to 75.
  <li> The list of URLs to be crawled is now based on the <a href="http://www.alexa.com/topsites">Alexa Top 1,000,000 Sites</a>. 
(See the related <a href="about.php#listofurls">FAQ</a>.)
  <li> The number of URLs crawled increased from 18,026 to 36,181 as a step toward our goal of 1M URLs. The HTTP Archive Mobile URLs increased from 1K to 2K.
</ul>

  <dt> June 1, 2011: HTTP Archive Mobile grows from top 100 to top 1000 URLs.

  <dt> May 13, 2011: <a href="http://www.stevesouders.com/blog/2011/05/13/http-archive-mobile/">HTTP Archive Mobile</a>
  <dd> The "alpha" version of HTTP Archive Mobile is announced at the Mobilism conference in Amsterdam. 
Initial runs are of the world's top 100 sites.

  <dt> April 8, 2011: <a href="http://news.cnet.com/8301-30685_3-20052018-264.html">CNET News Flash use dips at top Web sites since November</a>
  <dd> <p> Article published on CNET News citing various statistics from the HTTP Archive.

  <dt> April 5, 2011: hide small runs
  <dd> <p>The first three runs in the HTTP Archive (Oct 5, Oct 22, and Nov 6) only had ~1000 URLs.
Comparing those small runs to the later larger runs (that have ~17,000 URLs) can be misleading.
(See this <a href="http://www.stevesouders.com/blog/2011/04/05/http-archive-url-list-flash-trends/">blog post</a>.)
This change removes those first three runs from the UI to avoid these confusing comparisons.
The data is still <a href="downloads.php">downloadable</a>.</p>

  <dt> March 25, 2011: Page Speed updated
  <dd>
<p>
We used to run <a href="http://code.google.com/p/page-speed/">har_to_pagespeed</a> to generate Page Speed scores.
With this change the Page Speed scores are generated from WebPagetest. 
This means that more rules are evaluated and the score is more informative.
When using har_to_pagespeed the input is a HAR file so any rules requiring access to the page's DOM can not be scored.
WebPagetest, however, generates the Page Speed score while the page's DOM is available, thus resulting in a more accurate evaluate of the page's performance.
</p>
<p>
One side effect of this change is that comparisons of Page Speed scores to runs performed before March 25 are not apples-to-apples comparisons 
because this change in which rules are evaluated.
</p>
</dl>


<?php echo uiFooter() ?>

</body>

</html>

