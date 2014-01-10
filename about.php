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

require_once("utils.inc");
require_once("ui.inc");

$gTitle = "About the HTTP Archive";
?>
<!doctype html>
<html>
<head>
<title><?php echo $gTitle ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
<style>
LI.sublist { margin-bottom: 0; }

</style>
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<?php // Make sure to echo the drop down list of "About" links in ui.inc. ?>
<ul class="aboutlinks">
  <li> <a href="downloads.php">Download data</a>
  <li> <a href="urls.php">URLs</a>
  <li> <a href="http://code.google.com/p/httparchive/source/browse">Source code</a>
  <li> <a href="http://code.google.com/p/httparchive/issues/list">Bugs</a>
  <li> <a href="http://groups.google.com/group/httparchive/topics">Contact us</a>
</ul>


<h1 id="mission">Mission</h1>

<p>
Successful societies and institutions recognize the need to record their history - this provides a way to review the past, 
find explanations for current behavior,
and spot emerging trends.
In 1996 <a href="http://en.wikipedia.org/wiki/Brewster_Kahle">Brewster Kahle</a> realized the cultural significance of the Internet and the need to record its history. 
As a result he founded the <a href="http://archive.org/">Internet Archive</a> which collects and permanently stores the Web's digitized content.
</p>

<p>
In addition to the content of web pages, it's important to record how this digitized content is constructed and served.
The <a href="http://httparchive.org">HTTP Archive</a> provides this record.
It is a permanent repository of web performance information such as size of pages, failed requests, and technologies utilized. 
This performance information allows us to see trends in how the Web is built
and provides a common data set from which to conduct web performance research.
</p>




<h1 id=faq>FAQ</h1>


<?php
// I want some URLs to point back to the main website (currently for adding/removing sites).
$gMainUrl = ($gbMobile ? $gHAUrl : "" );

$gFAQ =<<<OUTPUT
			   <h2 id=listofurls>How is the list of URLs generated?</h2>

<p>
Starting in November 2011, the list of URLs is based solely on the <a href="http://www.alexa.com/topsites">Alexa Top 1,000,000 Sites</a>
(<a href="http://s3.amazonaws.com/alexa-static/top-1m.csv.zip">zip</a>).
Use the <a href="urls.php">HTTP Archive URLs</a> page to see the list of the top 10,000 URLs used in the most recent crawl.
</p>

<p>Prior to November 2011 there were 18K URLs analyzed based on the union of the following lists:
<a href="lists/Alexa%20500.txt">Alexa 500</a> (<a href="http://www.alexa.com/topsites/global">source</a>),
<a href="lists/Alexa%20US%20500.txt">Alexa US 500</a> (<a href="http://www.alexa.com/topsites/countries/US">source</a>),
<a href="lists/Alexa10K.txt">Alexa 10,000</a> (<a href="http://www.alexa.com/topsites">source</a>, <a href="http://s3.amazonaws.com/alexa-static/top-1m.csv.zip">zip</a>),
<a href="lists/Fortune%20500.txt">Fortune 500</a> (<a href="http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/">source</a>),
<a href="lists/Global%20500.txt">Global 500</a> (<a href="http://money.cnn.com/magazines/fortune/global500/2010/full_list/">source</a>),
and
<a href="lists/Quantcast10K.txt">Quantcast10K</a> (<a href="http://www.quantcast.com/top-sites-1">source</a>).
</p>



<h2 id=datagathered>How is the data gathered?</h2>

<p>The list of URLs is fed to our private instance of <a href="http://webpagetest.org">WebPagetest</a>. 
(Huge thanks to Pat Meenan!)</p>

<p>The WebPagetest settings are:</p>
<ul class=indent>
  <li> <strong>Internet Explorer 9</strong> (was IE8 until October 15, 2012) and iPhone4
  <li> the test agents are located in Redwood City, CA
  <li> the default WebPagetest connection speed is used
  <li> empty cache ("first view")
</ul>

<p>Each URL is loaded 3 times. The data from the median run (based on load time) is collected via a <a href="#harfile">HAR file</a>.
The HTTP Archive collects these HAR files, parses them, and populates our database with the relevant information.</p>



<h2 id=accuracy>How accurate is the data, in particular the time measurements?</h2>

<p>The "static" measurements (# of bytes, HTTP headers, etc. - everything but time) are accurate at the time the test was performed. It's entirely possible that the web page has changed since it was tested. The tests were performed using a single browser. If the page's content varies by browser this could be a source of differences.</p>

<p>
The time measurements are gathered in a test environment, and thus have all the potential biases that come with that:</p>
<ul class=indent> 
<li>browser - All tests are performed using a single browser. 
Page load times can vary depending on browser.
<li>location - The HAR files are generated from Redwood City, CA.
The distance to the site's servers can affect time measurements.
<li>sample size - Each URL is loaded three times. The HAR file is generated from the median test run.
This is not a large sample size.
<li>Internet connection - The connection speed, latency, and packet loss from the test location 
is another variable that affects time measurements.
</ul>

<p>Given these conditions it's virtually impossible to compare WebPagetest.org's time measurements with those gathered 
in other browsers or locations or connection speeds. They are best used as a source of comparison.</p>


<h2 id=xfersize2012>Why are transfer sizes prior to Oct 1 2012 smaller?</h2>

<p>
The <code>web10</code> parameter in the <a href="https://sites.google.com/a/webpagetest.org/docs/advanced-features/webpagetest-restful-apis#TOC-Parameters">WebPagetest API</a>
determines whether the test should stop at document complete (window.onload) as opposed to later once network activity has subsided. 
Prior to Oct 1 2012 the tests were configured to stop at document complete.
However, lazy loading resources (loading them dynamically after window.onload) has grown in popularity.
Therefore, this setting was changed so that these post-onload requests would be captured.
This resulted in more HTTP requests being recorded with a subsequent bump in transfer size.
</p>


<h2 id=testchanges>What changes have been made to the test environment that might affect the data?</h2>
The following test configuration changes could affect results:
<ul class=indent>
  <li> <strong>Nov 15 2013 and Dec 1 2013</strong> - 
Normally we use IE9 as our test agent, but sometime around Nov 15 2013 our test agents started auto-updating to IE11. 
In the Nov 15 2013 crawl about 7.5% of websites were tested with IE11. 
Although this affected some results, the impact was judged to be minimal so we left the data intact.
In the Dec 1 2013 crawl about 47% of websites were tested with IE11. 
This had a dramatic affect on results with a 10x increase in failures and a drop from 71% to 34% in responses gzipped.
(We are not sure what produced that change.) 
Because the results changed so significantly the data from the Dec 1 2013 crawl was removed.
  <li> <strong>Jun 24 2013</strong> - 
The default connection speed for mobile was decreased to an emulated 3G network.
  <li> <strong>Mar 19 2013</strong> - 
The default connection speed was increased from DSL (1.5 mbps) to Cable (5.0 mbps). This only affects IE (not iPhone).
  <li> <strong>Oct 1 2012</strong> - 
Instead of stopping at document complete (window.onload), the tests were changed to 
run until the end of network activity. This increased the size and number of requests per page.
  <li> <strong>Sep 1 2012</strong> - 
The number of URLs tested increased from 200K to 300K for IE, and from 2K to 5K for iPhone.
  <li> <strong>Jul 1 2012</strong> - 
The HTTP Archive Mobile switched from running on the Blaze.io framework to WebPagetest. 
This involved several changes including new iPhone hardware (although both used iOS5) 
and a new geo location (from Toronto to Redwood City).
  <li> <strong>May 1 2012</strong> - 
The number of URLs tested increased from 100K to 200K for IE.
  <li> <strong>Mar 15 2012</strong> - 
Switch from IE8 to IE9.
</ul>


			   <h2 id=limitations>What are the limitations of this testing methodology (using lists)?</h2>

<p>
The HTTP Archive examines each URL in the list, but does not crawl the website other pages.
Although this list of websites
is well known, the entire website doesn't necessarily map well to a single URL.</p>

<ul class=indent>
<li>Most websites are comprised of many separate web pages. The landing page may not be representative of the overall site.
<li>Some websites, such as <a href="http://www.facebook.com/">http://www.facebook.com/</a>, require logging in to see typical content.
<li>Some websites, such as <a href="http://www.googleusercontent.com/">http://www.googleusercontent.com/</a>, don't have a landing page. Instead, they are used for hosting other URLs and resources. In this case <a href="http://www.googleusercontent.com/">http://www.googleusercontent.com/</a> is the domain path used for resources inserted by users into Google documents, etc.</li>
</ul>

<p>Because of these issues and more, it's possible that the actual HTML document analyzed is not representative of the website.</p>




			   <h2 id=harfile>What's a "HAR file"?</h2>
					<p> HAR files are based on the <a href='http://groups.google.com/group/http-archive-specification'>HTTP Archive specification</a>. They capture web page loading information in a JSON format. See the <a href='http://groups.google.com/group/http-archive-specification/web/har-adopters?hl=en'>list of tools</a> that support the HAR format.</p>



			   <h2 id=waterfall>How is the HTTP waterfall chart generated?</h2>
					<p>The HTTP waterfall chart is generated from the HAR file via JavaScript. The code is from Jan Odvarko's <a href='http://www.softwareishard.com/har/viewer/'>HAR Viewer</a>. Jan is also one of the creators of the HAR specification. Thanks Jan!</p>

			   <h2 id=charts>What are the definitions for the various charts?</h2>
<p>
The charts from the <a href="trends.php">Trends</a> and <a href="interesting.php">Stats</a> pages are explained here.
</p>

<dl>
  <dt id=numurls> <a href="trends.php#numurls">URLs Analyzed</a>
  <dd> This chart shows the total number of URLs archived during each crawl. 
This chart is important because the number of URLs (sample size) can affect the metrics being gathered.

  <dt id=renderStart> <a href="trends.php#onLoad">Load Time</a>
  <dd> This chart plots the average window.onload time in milliseconds.

  <dt id=reqTotal> <a href="trends.php#renderStart">Start Render Time</a>
  <dd> Start render is the time at which something was first displayed to the screen.

  <dt id=bytesTotal> <a href="trends.php#bytesTotal">Total Transfer Size</a>
  <dd> This is the average transfer size of all responses for a single website. 
<!-- CVSNO - does this include headers? note in all sections below -->
Note that if the response is compressed, the transfer size is smaller than the original uncompressed content.

  <dt id=reqTotal> <a href="trends.php#reqTotal">Total Requests</a>
  <dd> This chart shows the average number of requests for a single website.


  <dt id=bytesHtml> <a href="trends.php#bytesHtml">HTML Transfer Size</a>
  <dd> This is the average transfer size of all HTML responses for a single website. 
Note that if the response is compressed, the transfer size is smaller than the original uncompressed content.

  <dt id=reqHtml> <a href="trends.php#reqHtml"></a>
  <dd> This chart shows the average number of HTML requests for a single website.


  <dt id=bytesJS> <a href="trends.php#bytesJS">JS Transfer Size</a>
  <dd> This is the average transfer size of all JavaScript responses for a single website. 
Note that if the response is compressed, the transfer size is smaller than the original uncompressed content.

  <dt id=reqJS> <a href="trends.php#reqJS">JS Requests</a>
  <dd> This chart shows the average number of JavaScript requests for a single website.


  <dt id=bytesCSS> <a href="trends.php#bytesCSS">CSS Transfer Size</a>
  <dd> This is the average transfer size of all stylesheet responses for a single website. 
Note that if the response is compressed, the transfer size is smaller than the original uncompressed content.

  <dt id=reqCSS> <a href="trends.php#reqCSS">CSS Requests</a>
  <dd> This chart shows the average number of stylesheet requests for a single website.


  <dt id=bytesImg> <a href="trends.php#bytesImg">Image Transfer Size</a>
  <dd> This is the average transfer size of all image responses for a single website. 

  <dt id=reqImg> <a href="trends.php#reqImg">Image Requests</a>
  <dd> This chart shows the average number of image requests for a single website.


  <dt id=bytesFlash> <a href="trends.php#bytesFlash">Flash Transfer Size</a>
  <dd> This is the average transfer size of all Flash responses for a single website. 

  <dt id=reqFlash> <a href="trends.php#reqFlash">Flash Requests</a>
  <dd> This chart shows the average number of Flash requests for a single website.


  <dt id=SpeedIndex> <a href="trends.php#SpeedIndex">Speed Index</a>
  <dd> This chart shows the average Speed Index value across all websites. 
<a href="https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index">Speed Index</a> measures how quickly the page is rendered. 
Lower values are better.

  <dt id=PageSpeed> <a href="trends.php#PageSpeed">PageSpeed Score</a>
  <dd> <a href="https://developers.google.com/speed/pagespeed/">PageSpeed</a> is a performance analysis tool that grades websites on
a scale of 1-100. 
Higher scores are better.
This chart shows the average PageSpeed score across all websites.

  <dt id=htmlDocSize> <a href="trends.php#htmlDocSize">Doc Size</a>
  <dd> This chart shows the average size in kB of the main HTML document for the website.
NOTE: Right now this is the <i>compressed</i> size. We hope to change that to the uncompressed size in the future.

  <dt id=numDomElements> <a href="trends.php#numDomElements">DOM Elements</a>
  <dd> This charts shows the average number of DOM elements across all websites.

  <dt id=numDomains> <a href="trends.php#numDomains"># Domains</a>
  <dd> A single web page typically loads resources from a variety of web servers across many domains.
This chart shows the average number of domains that are accessed across all websites.

  <dt id=maxDomainReqs> <a href="trends.php#maxDomainReqs">Max Reqs on 1 Domain</a>
  <dd> This long-named chart shows an interesting performance statistic.
A single web page typically loads resources from various domains.
For each page, the number of requests on the most-used domain is calculated,
and this chart shows the average of that value across all websites.

  <dt id=maxage0> <a href="trends.php#maxage0">Uncacheable Resources</a>
  <dd> A response can be read from the cache without requiring any HTTP requests if it is still fresh.
This <i>freshness lifetime</i> is determined by the
<a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9">Cache-Control</a> and
<a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.21">Expires</a> headers.
This chart shows the percentage of responses that were NOT cacheable, i.e, they had a "freshness lifetime" of zero seconds.
The <a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html">calculation of freshness lifetime</a> is complex but we've tried to reproduce it here as follows, where freshness lifetime is <code>expAge</code>:
<ul>
  <li> If <code>must-revalidate</code>, <code>no-cache</code>, or <code>no-store</code> is specified, then <code>expAge</code> is 0.
  <li> Otherwise, if <code>max-age</code> is specified, then the number of seconds is the <code>expAge</code>.
  <li> Otherwise, if there is an <code>Expires</code> header, <code>expAge</code> is the difference between the <code>Expires</code> date and the time when the request was made.
  <li> Otherwise, <code>expAge</code> is 0.
</ul>

  <dt id=perGlibs> <a href="trends.php#perGlibs">Sites using Google Libraries API</a>
  <dd> This is the percentage of sites that have at least one request containing "googleapis.com" in the hostname.

  <dt id=perFlash> <a href="trends.php#perFlash">Sites with Flash</a>
  <dd> This chart shows the percentage of sites that make at least one Flash request.
Note that this Flash request could be from an ad or some other third party content on the page, 
and may not be from the website's main content.

  <dt id=perFonts> <a href="trends.php#perFonts">Sites with Custom Fonts</a>
  <dd> This chart shows the percentage of sites that make at least one request for a custom font.
The determination of a custom font request is based on the Content-Type response header.
However, since many fonts today do not have the proper Content-Type value, we also include requests that end in 
".eot", ".ttf", ".woff", or ".otf", or contain ".eot?", ".ttf?", ".woff?", or ".otf?" (i.e., a querystring).

  <dt id=perCompressed> <a href="trends.php#perCompressed">Compressed Responses</a>
  <dd> This chart shows the number of compressed responses over the number of HTML, CSS, and JavaScript requests.
There's a flaw in this calculation because 10-20% of compressed responses are images, fonts, or Flash.
We'll be updating this chart soon.

  <dt id=perHttps> <a href="trends.php#perHttps">HTTPS Requests</a>
  <dd> This chart shows the percentage of requests done over https.

  <dt id=perErrors> <a href="trends.php#perErrors">Pages with Errors</a>
  <dd> This chart shows the percentage of pages that have at least one error, i.e., a response with a 4xx or 5xx status code.

  <dt id=perRedirects> <a href="trends.php#perRedirects">Pages with Redirects</a>
  <dd> This chart shows the percentage of websites that have at least one redirect.
A response is classified as a redirect if it has a 3xx status code other than 304.
Note that the redirect may be from an ad or other third party content.

  <dt id=perCdn> <a href="trends.php#perCdn">Sites hosting HTML on CDN</a>
  <dd> This measures the percentage of sites that have their main HTML document served from a CDN. 

  <dt id=bytesperpage> <a href="interesting.php#bytesperpage">Average Bytes per Page by Content Type</a>
  <dd> This chart shows the breakdown of website size by content type. 
Note that the sizes are the transfer sizes. 
Therefore, compressed responses are counted as smaller than the original uncompressed content.

  <dt id=responsesizes> <a href="interesting.php#responsesizes">Average Individual Response Size</a>
  <dd> This chart shows the average transfer size for specific content types.

  <dt id=googlelibs> <a href="interesting.php#googlelibs">Pages Using Google Libraries API</a>
  <dd> This chart shows the percentage of sites that have at least one request containing "googleapis.com" in the hostname.

  <dt id=flash> <a href="interesting.php#flash">Pages Using Flash</a>
  <dd> This chart shows the percentage of sites with at least one Flash request.

  <dt id=fonts> <a href="interesting.php#fonts">Pages Using Custom Fonts</a>
  <dd> This chart shows the percentage of sites that make at least one request for a custom font. 
See <a href="#perFonts">Sites with Custom Fonts</a> for more information.

  <dt id=imageformats> <a href="interesting.php#imageformats">Image Requests by Format</a>
  <dd> This chart breaks down all image requests based on format type.

  <dt id=caching> <a href="interesting.php#caching">Cache Lifetime</a>
  <dd> This shows a histogram of the cache lifetime (AKA, freshness lifetime) of requests across all websites.
See <a href="#maxage0">Uncacheable Resources</a> for more information.

  <dt id=protocol> <a href="interesting.php#protocol">HTTPS Requests</a>
  <dd> This chart shows the percentage of requests done over https.

  <dt id=errors> <a href="interesting.php#errors">Pages with Errors</a>
  <dd> This chart shows the percentage of pages that have at least one error, i.e., a response with a 4xx or 5xx status code.

  <dt id=redirects> <a href="interesting.php#redirects">Pages with Redirects</a>
  <dd> This chart shows the percentage of websites that have at least one redirect.
A response is classified as a redirect if it has a 3xx status code other than 304.
Note that the redirect may be from an ad or other third party content.

  <dt id=onLoad> <a href="interesting.php#onLoad">Highest Correlation to Load Time</a>
  <dd> This chart shows the five variables that have the highest correlation to page load time.

  <dt id=renderStart> <a href="interesting.php#renderStart">Highest Correlation to Render Time</a>
  <dd> This chart shows the five variables that have the highest correlation to start render time.

</dl>


			   <h2 id=tablecolumns>What are the definitions for the table columns for a website's requests?</h2>

<p>
The View Site page contains a table with information about each HTTP request in an individual page,
for example <a href="viewsite.php?pageid=1942&a=Alexa%20500">http://www.w3.org/</a>. 
The more obtuse columns are defined here:
</p>

<ul class=indent>
	<li> Req# - The sequence number for each HTTP request - 1 = first, 2 = second, etc.
	<li> URL - The URL of the HTTP request. These are often truncated in the display. Hold your mouse over the link to see the full URL in the browser's status bar.
	<li> MIME Type - The request's MIME type.
	<li> Method - The HTTP request method.
	<li> Status - The HTTP response status code.
	<li> Time - The number of milliseconds it took to complete the request.
	<li> Response Size - The size of the response transferred over the wire. If the response was compressed the actual size of the response content is larger.
	<li> Request Cookie Len - The size of the Cookie: request header.
	<li> Response Cookie Len - The size of the Set-Cookie: response header.
	<li> Response HTTP Ver - The HTTP version number sent in the request.
	<li> Response HTTP Ver - The HTTP version number received in the response.
	<li> other HTTP request headers:
	  <ul class="indent,sublist">
	    <li class=sublist> Accept
	    <li class=sublist> Accept-Encoding
	    <li class=sublist> Accept-Language
	    <li class=sublist> Connection
	    <li class=sublist> Host
	    <li class=sublist> Referer
	  </ul>
	<li> other HTTP response headers:
	  <ul class="indent,sublist">
	    <li class=sublist> Accept-Ranges
	    <li class=sublist> Age
	    <li class=sublist> Cache-Control
	    <li class=sublist> Connection
	    <li class=sublist> Content-Encoding
	    <li class=sublist> Content-Language
	    <li class=sublist> Content-Length
	    <li class=sublist> Content-Location
	    <li class=sublist> Content-Type
	    <li class=sublist> Date
	    <li class=sublist> Etag
	    <li class=sublist> Expires
	    <li class=sublist> Keep-Alive
	    <li class=sublist> Last-Modified
	    <li class=sublist> Location
	    <li class=sublist> Pragma
	    <li class=sublist> Server
	    <li class=sublist> Transfer-Encoding
	    <li class=sublist> Vary
	    <li class=sublist> Via
	    <li class=sublist> X-Powered-By
	  </ul>
</ul>

<p>
Definitions for each of the HTTP headers can be found in the
<a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html">HTTP/1.1: Header Field Definitions</a>.
</p>



<h2 id=addsite>How do I add a website to the HTTP Archive?</h2>
<p>
You can add a website to the HTTP Archive via the <a href="{$gMainUrl}addsite.php">Add a Site page</a>.
</p>



<h2 id=removesite>How do I get my website removed from the HTTP Archive?</h2>
<p>
You can have your site removed from the HTTP Archive via the
<a href="{$gMainUrl}removesite.php">Remove Your Site page</a>.
</p>




			   <h2 id=adultcontent>How do I report inappropriate (adult only) content?</h2>
					 <p>
Please report any inappropriate content by
<a href="http://code.google.com/p/httparchive/issues/entry?summary=Inappropriate+Content">creating a new issue</a>.
You may come across inappropriate content when viewing a website's filmstrip screenshots.
You can help us flag these websites.
Screenshots are not shown for websites flagged as adult only.
</p>



			   <h2 id=who>Who created the HTTP Archive?</h2>
<p>Steve Souders created the HTTP Archive. 
It's built on the shoulders of Pat Meenan's <a href="http://www.webpagetest.org">WebPagetest</a> system.
Several folks on Google's Make the Web Faster team chipped in.
I've received patches from several individuals including 
<a href="http://www.jonathanklein.net">Jonathan Klein</a>,
<a href="http://yusuketsutsumi.com">Yusuke Tsutsumi</a>,
<a href="http://www.ioncannon.net/">Carson McDonald</a>, 
<a href="http://jbyers.com/">James Byers</a>,
<a href="http://greenido.wordpress.com/">Ido Green</a>,
<a href="http://www.clark-consulting.eu/">Charlie Clark</a>,
<a href="http://6a68.net/">Jared Hirsch</a>,
 and Mike Pfirrmann.
Guy Leech helped early on with the design.
More recently, <a href="https://twitter.com/#!/stephenhay">Stephen Hay</a> created the new logo.
</p>

<p>The <a href="http://mobile.httparchive.org/">HTTP Archive Mobile</a> test framework uses
<a href="http://code.google.com/p/mobitest-agent/">Mobitest</a> from <a href="https://blogs.akamai.com/2012/03/open-sourcing-mobitest.html">Blaze.io &amp; Akamai</a>
with much help from <a href="https://twitter.com/guypod">Guy (Guypo) Podjarny</a>.
</p>


			   <h2 id=sponsors>Who sponsors the HTTP Archive?</h2>
<p>
The HTTP Archive is possible through the support of these sponsors:
<a title="Google" href="http://www.google.com/">Google</a>,
<a title="Mozilla" href="http://www.mozilla.org/firefox">Mozilla</a>,
<a title="New Relic" href="http://www.newrelic.com/">New Relic</a>,
<a title="O'Reilly Media" href="http://oreilly.com/">O&#8217;Reilly Media</a>,
<a href="http://www.etsy.com/">Etsy</a>,
<a title="Radware" href="http://www.radware.com/">Radware</a>,
<a title="dynaTrace Software" href="http://www.dynatrace.com/">dynaTrace Software</a>,
and
<a title="Torbit" href="http://torbit.com/">Torbit</a>.
</p>

<div>
<a class=image-link title="Google" href="http://www.google.com/"><img class="alignnone" title="Google" src="/images/google.gif" alt="" width="120" height="40" /></a> 
<a class=image-link style="margin-left: 10px;" title="Mozilla" href="http://www.mozilla.org/firefox"><img class="alignnone" title="Mozilla" src="/images/mozilla.png" alt="" width="145" height="100" /></a> 
<a class=image-link style="margin-left: 10px;" title="New Relic" href="http://www.newrelic.com/"><img class="alignnone" title="New Relic" src="/images/newrelic.gif" alt="" width="120" height="22" /></a> 
<a class=image-link style="margin-left: 10px;" title="O'Reilly Media" href="http://oreilly.com/"><img class="alignnone" title="O'Reilly Media" src="/images/oreilly.gif" alt="" width="155" height="35" /></a></div>
<div style="margin-top: 20px;">
<a class=image-link href="http://www.etsy.com/"><img class="alignnone" title="Etsy" src="/images/etsy.png" alt="" width="106" height="61" /></a> 
<a class=image-link style="margin-left: 10px; vertical-align: top;" title="Radware" href="http://www.radware.com/"><img style="padding-bottom: 10px;" class="alignnone" title="Radware" src="/images/radware.jpg" alt="" width="150" height="49" /></a> 
<a class=image-link style="margin-left: 10px;" title="dynaTrace Software" href="http://www.dynatrace.com/"><img class="alignnone" title="dynaTrace Software" src="/images/dynatrace.gif" alt="" width="120" height="31" /></a>
<a class=image-link style="margin-left: 20px;" title="Torbit" href="http://torbit.com/"><img style="padding-bottom: 20px;" class="alignnone" title="Torbit" src="/images/torbit_120.png" alt="" width="120" height="25" /></a>
</div>


			   <h2 id=donate>How do I make a donation to support the HTTP Archive?</h2>
<p>
The HTTP Archive is part of the Internet Archive, a 501(c)(3) non-profit.
Donations in support of the HTTP Archive can be made through the Internet Archive's 
<a href="http://www.archive.org/donate/index.php">donation page</a>.
Make sure to designate your donation is for the "HTTP Archive".
</p>

			   <h2 id=contact>Who do I contact for more information?</h2>
					 <p>Please go to the <a href='http://groups.google.com/group/httparchive/topics'>HTTP Archive discussion list</a> and submit a post.</p>

OUTPUT;

// extract all the questions
$aQuestions = explode("<h2", $gFAQ);
echo "<ul style='list-style-type: none;'>\n";
foreach($aQuestions as $q) {
	$aMatches = array();
	if ( preg_match('/id=(.*?)\>(.*)\<\/h2\>/', $q, $aMatches) ) {
		$id = $aMatches[1];
		$question = $aMatches[2];
		echo " <li> <a href='#$id'>Q: $question</a>\n";
	}
}
echo "</ul>\n\n";

echo $gFAQ;
?>

<?php echo uiFooter() ?>

</body>
</html>
