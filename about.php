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

require_once("ui.php");

$gTitle = "About the HTTP Archive";
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title><?php echo $gTitle ?></title>
	<meta charset="UTF-8">
</head>

<body>
<?php echo uiHeader($gTitle); ?>


<ul class="aboutlinks">
  <li> <a href="downloads.php">Download data</a>
  <li> <a href="http://code.google.com/p/httparchive/source/browse">Source code</a>
  <li> <a href="http://code.google.com/p/httparchive/issues/list">Bug list</a>
  <li> <a href="http://groups.google.com/group/httparchive/topics">Contact us</a>
</ul>


<h1>Mission</h1>

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
It provides permanent storage for web performance information such as size of pages, failed requests, and technologies utilized. 
This performance information allows us to see trends in how the Web is built
and provides a common data set from which to conduct web performance research.
</p>




<h1>FAQ</h1>


			   <h2>How is the list of URLs generated?</h2>

<p>As of November 2010 the URLs that are analyzed is the union of the following lists:
<ul class=indent>
  <li> <a href="lists/Alexa+500.txt">Alexa 500</a> (<a href="http://www.alexa.com/topsites/global">source</a>)
  <li> <a href="lists/Alexa+US+500.txt">Alexa US 500</a> (<a href="http://www.alexa.com/topsites/countries/US">source</a>)
  <li> <a href="lists/Alexa10K.txt">Alexa 10,000</a> (<a href="http://www.alexa.com/topsites">source</a>, <a href="http://s3.amazonaws.com/alexa-static/top-1m.csv.zip">zip</a>)
  <li> <a href="lists/Fortune+500.txt">Fortune 500</a> (<a href="http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/">source</a>)
  <li> <a href="lists/Global+500.txt">Global 500</a> (<a href="http://money.cnn.com/magazines/fortune/global500/2010/full_list/">source</a>)
  <li> <a href="lists/Quantcast10K.txt">Quantcast10K</a> (<a href="http://www.quantcast.com/top-sites-1">source</a>)
</ul>




<h2>How is the data gathered?</h2>

<p>The list of URLs is fed to <a href="http://webpagetest.org">WebPagetest.org</a>. (Huge thanks to Pat Meenan!)</p>

<p>The WebPagetest settings are:</p>
<ul class=indent>
  <li> <strong>Internet Explorer 8</strong>
  <li> Dulles, VA
  <li> DSL
  <li> empty cache
</ul>

<p>Each URL is loaded nine times. The data from the median run (based on load) is collected via a <a href="#harfile">HAR file</a>.
The HTTP Archive collects these HAR files, parses them, and populates our database with the relevant information.</p>


<h2>How accurate is the data, in particular the time measurements?</h2>

<p>The "static" measurements (# of bytes, HTTP headers, etc. - everything but time) are accurate at the time the test was performed. It's entirely possible that the web page has changed since it was tested. The tests were performed using Internet Explorer 8. If the page's content varies by browser this could be a source of differences.</p>

<p>
The time measurements are gathered in a test environment, and thus have all the potential biases that come with that:</p>
<ul class=indent> 
<li>browser - All tests are performed using Internet Explorer 8. 
Page load times can vary depending on browser.
<li>location - The HAR files are generated from WebPagetest.org's location in Dulles, Virginia.
The distance to the site's servers can affect time measurements.
<li>sample size - Each URL is loaded nine times. The HAR file is generated from the median test run.
This is not a large sample size.
<li>Internet connection - The connection speed, latency, and packet loss from the test location 
is another variable that affects time measurements.
</ul>

<p>Given these conditions it's virtually impossible to compare WebPagetest.org's time measurements with those gathered 
in other browsers or locations or connection speeds. They are best used as a source of comparison.</p>





			   <h2>What are the limitations of this testing methodology (using lists)?</h2>

<p>Although these lists of websites
(<a href="http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/">Fortune 500</a>
and 
<a href="http://www.alexa.com/topsites">Alexa Top 500</a> for example)
are well known, the entire website doesn't necessarily map well to a single URL.</p>
<ul class=indent>
<li>Most websites are comprised of many separate web pages. The landing page may not be representative of the overall site.
<li>Some websites, such as <a href="http://www.facebook.com/">http://www.facebook.com/</a>, require logging in to see typical content.
<li>Some websites, such as <a href="http://www.googleusercontent.com/">http://www.googleusercontent.com/</a>, don't have a landing page. Instead, they are used for hosting other URLs and resources. In this case <a href="http://www.googleusercontent.com/">http://www.googleusercontent.com/</a> is the domain path used for resources inserted by users into Google documents, etc.</li>
</ul>

<p>Because of these issues and more, it's possible that the actual HTML document analyzed is not representative of the website.</p>

			   <h2>Can you define the table columns?</h2>

<p>There are two main tables: the Archive table and the Site table.</p> 
<p>The Archive table shows summary information about each of the URLs in an archive, for example, <a href="viewarchive.php?a=Alexa%20500">Alexa 500</a>.</p>
<p>The Site table shows information about a single URL, such as <a href="viewsite.php?pageid=1942&a=Alexa%20500">http://www.w3.org/</a>. Below is a list of column definitions for each of these tables.</p>

<h3>Archive table:</h3>

<ul class=indent>
	<li>Website - The URL that was tested.
	<li>load time - The time from when the URL was requested to when the window load event fired.
	<li>start render - The time from when the URL was requested to when the first content was rendered.
	<li>Page Speed score - The score from the <a href="http://code.google.com/speed/page-speed/gallery.html">Page Speed SDK</a>.
	<li>total reqs - Total number of HTTP requests.
	<li>total xfer size - Total number of kB transferred over the wire for all HTTP requests including HTTP headers.
	<li>html reqs &amp; xfer size - Number of HTML requests and their total transfer size.
	<li>JS reqs &amp; xfer size - Number of script requests and their total transfer size.
	<li>CSS reqs &amp; xfer size - Number of stylesheet requests and their total transfer size.
	<li>image reqs &amp; xfer size - Number of images requests and their total transfer size.
	<li>domains - Number of unique domains used in the page.
</ul>

<h3>
Site table:
</h3>
<ul class=indent>
	<li> req# - The sequence number for each HTTP request - 1 = first, 2 = second, etc.
	<li> URL - The URL of the HTTP request. These are often truncated in the display. Hold your mouse over the link to see the full URL in the browser's status bar.
	<li> mime type - The request's mime type.
	<li> method - The HTTP request method.
	<li> status - The HTTP response status code.
	<li> time - The number of milliseconds it took to complete the request.
	<li> response Size - The size of the response transferred over the wire. If the response was compressed the actual size of the response content is larger.
	<li> request/response Cookie Len - The size of the Cookie: request header and Set-Cookie: response header.
	<li> response/response Http Ver - The HTTP version number sent in the request and received in the response.
	<li> other HTTP request headers:
	  <ul class=indent>
	  <li> Accept
	  <li> Accept-Encoding
	  <li> Accept-Language
	  <li> Connection
	  <li> Host
	  <li> Referer
	  </ul>
	<li> other HTTP response headers:
	  <ul class=indent>
	  <li> Accept-Ranges
	  <li> Age
	  <li> Cache-Control
	  <li> Connection
	  <li> Content-Encoding
	  <li> Content-Language
	  <li> Content-Length
	  <li> Content-Location
	  <li> Content-Type
	  <li> Date
	  <li> Etag
	  <li> Expires
	  <li> Keep-Alive
	  <li> Last-Modified
	  <li> Location
	  <li> Pragma
	  <li> Server
	  <li> Transfer-Encoding
	  <li> Vary
	  <li> Via
	  <li> X-Powered-By
	  </ul>
</ul>

<p>
Definitions for each of the HTTP headers can be found in the
<a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html">HTTP/1.1: Header Field Definitions</a>.</p>

			   <h2>What's a "HAR file"?</h2>
					<p> HAR files are based on the <a href='http://groups.google.com/group/http-archive-specification'>HTTP Archive specification</a>. They capture web page loading information in a JSON format. See the <a href='http://groups.google.com/group/http-archive-specification/web/har-adopters?hl=en'>list of tools</a> that support the HAR format.</p>

			   <h2>How is the HTTP waterfall chart generated?</h2>
					<p>The HTTP waterfall chart is generated from the HAR file via JavaScript. The code is from Jan Odvarko's <a href='http://www.softwareishard.com/har/viewer/'>HAR Viewer</a>. Jan is also one of the creators of the HAR specification. Thanks Jan!</p>

			   <h2>How do I report inappropriate (adult only) content?</h2>
					 <p>Please report any inappropriate content by
<a href="http://code.google.com/p/httparchive/issues/entry?summary=Inappropriate+Content">creating a new issue</a>.
You may come across this issue when viewing the filmstrip screenshots of adult only websites. 
You can help us flag these websites.
Screenshots are not shown for websites flagged as adult only.
</p>

			   <h2>Who created the HTTP Archive?</h2>
					 <p>Steve Souders with the help of the Open Source community and particular support from Pat Meenan.</p>

			   <h2>Who do I contact for more information?</h2>
					 <p>Please go to the <a href='http://groups.google.com/group/httparchive/topics'>HTTP Archive discussion list on Google Groups</a> and submit a post.</p>

<?php echo uiFooter() ?>

</body>
</html>