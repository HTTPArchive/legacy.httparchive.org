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

<h1>Mission</h1>

<p>
Successful societies and institutions recognize the need to record their history - this provides a way to review the past, spot emerging trends, and find explanations for current behavior. 
In 1996 <a href="http://en.wikipedia.org/wiki/Brewster_Kahle">Brewster Kahle</a> realized the cultural significance of the Internet and the need to record its history. 
As a result he founded the <a href="http://archive.org/">Internet Archive</a> which collects and permanently stores digitized information. 
</p>

<p>
Because digitized content is so prevalent in and significant to today's society, 
it follows that peoples' ability to successfully access that information is critical - 
a website that has errors or takes too long is affecting the ability of people to see its content. 
The Internet Archive provides a history of digitized content, but there is no history of how that content was constructed and served. 
</p>

<p>
The <a href="http://httparchive.org">HTTP Archive</a> fills this gap by recording this performance meta information about Internet content. 
It provides permanent storage for web performance information such as size of pages, failed requests, and technologies utilized. 
With this web performance information we can begin to see trends in how successful and easy it is to access this pervasive source of information. 
</p>




<h1>FAQ</h1>

<?php
$gFaqs = array(
			   array("How is the data gathered?",
					 <<<OUTPUT
The list of websites is fed to <a href="http://webpagetest.org">WebPagetest.org</a>.
(Huge thanks to Pat Meenan!)
WebPagetest generates a <a href="#harfile">HAR file</a> for each website.
The HTTP Archive code parses these HAR files and populates our database with the relevant information.
OUTPUT
					 ,
					 "datacollection"),

			   array("How accurate is the data, in particular the time measurements?",
					 <<<OUTPUT
The "static" measurements (# of bytes, HTTP headers, etc. - everything but time) are accurate at the time the test was performed.
It's entirely possible that the site has changed since it was tested. 
The tests were performed using Internet Explorer 8.
If the site's content varies by browser this could be a source of differences.

<p>
The time measurements are gathered in a test environment, and thus have all the potential biases that come with that:
<ul> 
<li> <i>browser</i> - All tests are performed using Internet Explorer 8. 
Page load times can vary depending on browser.
<li> <i>location</i> - The HAR files are generated from WebPagetest.org's location in Dulles, Virginia.
The distance to the site's servers can affect time measurements.
<li> <i>sample size</i> - Each site is loaded nine times. The HAR file is generated from the median test run.
This is not a large sample size.
<li> <i>Internet connection</i> - The connection speed, latency, and packet loss from the test location 
is another variable that affects time measurements.
</ul>

Given these conditions it's virtually impossible to compare WebPagetest.org's time measurements with those gathered 
in other browsers or locations or connection speeds. 
They are best used as a source of comparison.
OUTPUT
					 ,
					 "accuracy"),

			   array("What are the limitations of this testing methodology (using lists)?",
					 <<<OUTPUT
Although these lists of websites, 
<a href="http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/">Fortune 500</a>
and 
<a href="http://www.alexa.com/topsites">Alexa Top 500</a>
for example,
are well known they don't necessarily map well to a single URL. 
<ul>
<li> Some websites, such as <a href="http://www.facebook.com/">http://www.facebook.com/</a>, require logging typical content. 
<li> Some websites, such as <a href="http://www.googleusercontent.com/">http://www.googleusercontent.com/</a>, don't have a landing page.
Instead, they are used for hosting other URLs and resources. In this case <a href="http://www.googleusercontent.com/">http://www.googleusercontent.com/</a>
is the domain path used for resources inserted by users into Google documents, etc.
</ul>

Because of these issues and more, it's possible that the actual HTML document analyzed is not representative of the website.
OUTPUT
					 ,
					 "methodology"),

			   array("Can you define the table columns?",
					 <<<OUTPUT
There are two main tables: the Archive table and the Site table. 
The Archive table shows summary information about each of the sites in an archive, for example, <a href="viewarchive.php?a=Alexa%20500">Alexa 500</a>.
The Site table shows information about a single site, such as <a href="viewsite.php?pageid=1942&a=Alexa%20500">http://www.w3.org/</a>.
Below is a list of column definitions for each of these tables.

<p>
Archive table:
</p>
<ul>
<li> url
</ul>
OUTPUT
					 ,
					 "methodology"),

			   array("What's a \"HAR file\"?",
					 "HAR files are based on the <a href='http://groups.google.com/group/http-archive-specification'>HTTP Archive specification</a>. They capture web page loading information in a JSON format. See the <a href='http://groups.google.com/group/http-archive-specification/web/har-adopters?hl=en'>list of tools</a> that support the HAR format.",
					 "harfile"),

			   array("How is the HTTP waterfall chart generated?",
					 "The HTTP waterfall chart is generated from the HAR file via JavaScript. The code is from Jan Odvarko's <a href='http://www.softwareishard.com/har/viewer/'>HAR Viewer</a>. Jan is also one of the creators of the HAR specification. Thanks Jan!",
					 "harfile"),

			   array("Who do I contact for more information?",
					 "Go to the <a href='http://groups.google.com/group/httparchive/topics'>HTTP Archive discussion list on Google Groups</a> and submit a post.",
					 "contact")

			   );


// print the list of questions
echo "<ul class=questions style='list-style-type: none; margin-left: 0 0 8px 20px; padding-left: 0;'>\n";
for ( $i = 0; $i < count($gFaqs); $i++ ) {
	$q = $gFaqs[$i][0];
	if ( "category" == $q ) {
		$category = $gFaqs[$i][1];
		echo "</ul><div class=category>$category</div><ul class=questions style='list-style-type: none; margin: 0 0 8px 20px; padding-left: 0;'>\n";
	}
	else {
		$anchor = $gFaqs[$i][2];
		echo " <li> <a class=ahover href='#$anchor'>Q: $q</a>\n";
	}
}
echo "</ul>\n\n";


// print the list of Q&A
echo "<hr style='margin-top: 20px; margin-bottom: 20px;'>\n\n";
echo "<table border=0 cellpadding=2 cellspacing=0>\n";
for ( $i = 0; $i < count($gFaqs); $i++ ) {
	$q = $gFaqs[$i][0];

	if ( "category" == $q ) {
		continue;
	}

	$a = $gFaqs[$i][1];
	$anchor = $gFaqs[$i][2];
	echo "<a name='$anchor'></a>\n<tr><td align=right class=question>Q:</td> <td class=question>$q</td></tr>\n";
	echo "<tr><td align=right valign=top><b>A:</b></td> <td class=answer>$a</td></tr>\n\n";
}
echo "</table>\n\n";
?>

<?php echo uiFooter() ?>

</body>

</html>
