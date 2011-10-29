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


<ul class="aboutlinks">
  <li> <a href="downloads.php">Download data</a>
  <li> <a href="http://code.google.com/p/httparchive/source/browse">Source code</a>
  <li> <a href="http://code.google.com/p/httparchive/issues/list">Bugs</a>
  <li> <a href="news.php">News</a>
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
$gFAQ =<<<OUTPUT
			   <h2 id=listofurls>How is the list of URLs generated?</h2>

<p>As of November 2010 the URLs that are analyzed is the union of the following lists:
<ul class=indent>
  <li> <a href="lists/Alexa%20500.txt">Alexa 500</a> (<a href="http://www.alexa.com/topsites/global">source</a>)
  <li> <a href="lists/Alexa%20US%20500.txt">Alexa US 500</a> (<a href="http://www.alexa.com/topsites/countries/US">source</a>)
  <li> <a href="lists/Alexa10K.txt">Alexa 10,000</a> (<a href="http://www.alexa.com/topsites">source</a>, <a href="http://s3.amazonaws.com/alexa-static/top-1m.csv.zip">zip</a>)
  <li> <a href="lists/Fortune%20500.txt">Fortune 500</a> (<a href="http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/">source</a>)
  <li> <a href="lists/Global%20500.txt">Global 500</a> (<a href="http://money.cnn.com/magazines/fortune/global500/2010/full_list/">source</a>)
  <li> <a href="lists/Quantcast10K.txt">Quantcast10K</a> (<a href="http://www.quantcast.com/top-sites-1">source</a>)
</ul>




<h2 id=datagathered>How is the data gathered?</h2>

<p>The list of URLs is fed to <a href="http://webpagetest.org">WebPagetest.org</a>. (Huge thanks to Pat Meenan!)</p>

<p>The WebPagetest settings are:</p>
<ul class=indent>
  <li> <strong>Internet Explorer 8</strong>
  <li> Dulles, VA
  <li> DSL
  <li> empty cache
</ul>

<p>Each URL is loaded 3 times. The data from the median run (based on load) is collected via a <a href="#harfile">HAR file</a>.
The HTTP Archive collects these HAR files, parses them, and populates our database with the relevant information.</p>

<p>
For the <a href="http://mobile.httparchive.org/">HTTP Archive Mobile</a> the data is gathered using Blaze.io's mobile web performance tool 
<a href="http://www.blaze.io/mobile/">Mobitest</a> using iPhone 4.3.
Please see their <a href="http://origwww.blaze.io/mobile/methodology/">methodology page</a> for more information.
</p>

<h2 id=accuracy>How accurate is the data, in particular the time measurements?</h2>

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





			   <h2 id=limitations>What are the limitations of this testing methodology (using lists)?</h2>

<p>
The HTTP Archive examines each URL in the list, but does not crawl the website other pages.
Although these lists of websites
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




			   <h2 id=harfile>What's a "HAR file"?</h2>
					<p> HAR files are based on the <a href='http://groups.google.com/group/http-archive-specification'>HTTP Archive specification</a>. They capture web page loading information in a JSON format. See the <a href='http://groups.google.com/group/http-archive-specification/web/har-adopters?hl=en'>list of tools</a> that support the HAR format.</p>



			   <h2 id=waterfall>How is the HTTP waterfall chart generated?</h2>
					<p>The HTTP waterfall chart is generated from the HAR file via JavaScript. The code is from Jan Odvarko's <a href='http://www.softwareishard.com/har/viewer/'>HAR Viewer</a>. Jan is also one of the creators of the HAR specification. Thanks Jan!</p>


<h2 id=intersection>When looking at Trends what does it mean to choose the "intersection" URLs?</h2>
<p>
The number and exact list of URLs changes from run to run.
Comparing trends for "All" the URLs from run to run is a bit like comparing apples and oranges.
For more of an apples to apples comparison you can choose the "intersection" URLs.
This is the maximum set of URLs that were measured in every run.
</p>

 

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




<h2 id=removesite>How do I get my website removed from the HTTP Archive?</h2>
<p>
You can have your site removed from the HTTP Archive via the
<a href="removesite.php">Remove Your Site page</a>.
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
 and Mike Pfirrmann.
Guy Leech helped early on with the design.
More recently, <a href="https://twitter.com/#!/stephenhay">Stephen Hay</a> created the new logo.
</p>

<p>The <a href="http://mobile.httparchive.org/">HTTP Archive Mobile</a> test framework is provided by 
<a href="http://www.blazeio.com/">Blaze.io</a> with much help from Guy (Guypo) Podjarny.
</p>


			   <h2 id=sponsors>Who sponsors the HTTP Archive?</h2>
<p>
The HTTP Archive is possible through the support of these sponsors:
<a title="Google" href="http://www.google.com/">Google</a>,
<a title="Mozilla" href="http://www.mozilla.org/firefox">Mozilla</a>,
<a title="New Relic" href="http://www.newrelic.com/">New Relic</a>,
<a title="O'Reilly Media" href="http://oreilly.com/">O&#8217;Reilly Media</a>,
<a href="http://www.etsy.com/">Etsy</a>,
<a title="Strangeloop Networks" href="http://www.strangeloopnetworks.com/">Strangeloop</a>,
and <a title="dynaTrace Software" href="http://www.dynatrace.com/">dynaTrace Software</a>.
</p>
<div><a title="Google" href="http://www.google.com/"><img class="alignnone" title="Google" src="http://httparchive.org/images/google.gif" alt="" width="120" height="40" /></a> <a style="margin-left: 10px;" title="Mozilla" href="http://www.mozilla.org/firefox"><img class="alignnone" title="Mozilla" src="http://httparchive.org/images/mozilla.png" alt="" width="145" height="100" /></a> <a style="margin-left: 10px;" title="New Relic" href="http://www.newrelic.com/"><img class="alignnone" title="New Relic" src="http://httparchive.org/images/newrelic.gif" alt="" width="120" height="22" /></a> <a style="margin-left: 10px;" title="O'Reilly Media" href="http://oreilly.com/"><img class="alignnone" title="O'Reilly Media" src="http://httparchive.org/images/oreilly.gif" alt="" width="155" height="35" /></a></div>
<div style="margin-top: 20px;"><a href="http://www.etsy.com/"><img class="alignnone" title="Etsy" src="http://httparchive.org/images/etsy.png" alt="" width="106" height="61" /></a> <a style="margin-left: 10px; vertical-align: top;" title="Strangeloop Networks" href="http://www.strangeloopnetworks.com/"><img class="alignnone" title="Strangeloop" src="http://httparchive.org/images/strangeloop.gif" alt="" width="120" height="25" /></a> <a style="margin-left: 10px;" title="dynaTrace Software" href="http://www.dynatrace.com/"><img class="alignnone" title="dynaTrace Software" src="http://httparchive.org/images/dynatrace.gif" alt="" width="120" height="31" /></a></div>


			   <h2 id=donate>How do I make a donation to support the HTTP Archive?</h2>
<p>
The HTTP Archive is part of the Internet Archive, a 501(c)(3) non-profit.
Donations in support of the HTTP Archive can be made through the Internet Archive's <a href="http://www.archive.org/donate/index.php">donation page</a>.
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
