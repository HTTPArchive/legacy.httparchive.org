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

$gLabel = getParam('l', latestLabel($gArchive));
$gSlice = getParam('s', 'All');
$gTitle = "Interesting Stats";
?>
<!doctype html>
<html>
<head>
<title><?php echo genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
<style>
.chart { 
	border: 1px solid #BBB; 
	padding: 4px; 
	margin-bottom: 40px; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>

<div style="float:right; margin-right: 10em;">
<a href="about.php#bigquery">Write your own custom queries!</a>
</div>

<h1>Interesting stats</h1>

<p>
Got a stat you'd like to see?
<a href="https://github.com/HTTPArchive/httparchive/issues" target="_blank">Suggest it!</a>
<span style="margin-left: 20px;">New feature: <a href="compare.php">Compare two runs</a></span>
</p>

<div style="float: left; margin-right: 20px;">
<form>
	<label>Choose a run:</label>
	<?php echo selectArchiveLabel($gArchive, $gLabel); ?>
</form>
</div>

<form>
	<label>Choose URLs:</label>
<?php
echo selectSlice($gSlice, "onchange='document.location=\"?a=$gArchive&l=$gLabel&s=\"+escape(this.options[this.selectedIndex].value)'");
?>
</form>

<div id=interesting style="margin-top: 40px;">
<?php 

require_once("stats.inc");
require_once("charts.inc");
$hStats = getStats($gLabel, $gSlice, curDevice());
$hCdf = getCdfData($gLabel, $gSlice, curDevice());

echo bytesContentTypeChart($hStats) . "\n";
echo responseSizes($hStats) . "\n";
echo histogram($hCdf, "bytesHtmlDoc", "HTML Document Transfer Size", "bytesHtmlDoc", 5*1024) . "\n";
echo histogram($hCdf, "numDomElements", "# of DOM Elements per Page", "numDomElements", 400, 2) . "\n";

echo percentGoogleLibrariesAPI($hStats) . "\n";
echo percentFlash($hStats) . "\n";
echo percentFonts($hStats) . "\n";
echo popularImageFormats($hStats) . "\n";
echo maxage($hStats) . "\n";
echo histogram($hCdf, "numRedirects", "Redirects per Page", "redirects") . "\n";
echo histogram($hCdf, "_connections", "Connections per Page", "connections", 10) . "\n";

echo histogram($hCdf, "avg_dom_depth", "Avg DOM Depth", "avgdomdepth") . "\n";
echo histogram($hCdf, "document_height", "Document Height (pixels)", "docheight", 1000) . "\n";
echo histogram($hCdf, "localstorage_size", "Size of localStorage (chars)", "localstorage", 50) . "\n";
echo histogram($hCdf, "sessionstorage_size", "Size of sessionStorage (chars)", "sessionstorage", 50) . "\n";
echo histogram($hCdf, "num_iframes", "Iframes per Page", "numiframes") . "\n";
echo histogram($hCdf, "num_scripts", "Script Tags per Page", "numscripts", 10) . "\n";

echo percentByProtocol($hStats) . "\n";
echo requestErrors($hStats) . "\n";

echo correlationChart($hStats, "onLoad") . "\n";
echo correlationChart($hStats, "renderStart") . "\n";

echo histogram($hCdf, "reqTotal", "Total Requests per Page", "reqTotal", 25) . "\n";
echo histogram($hCdf, "bytesTotal", "Total Transfer Size per Page", "bytesTotal", 1024*1024) . "\n";
echo histogram($hCdf, "reqHtml", "HTML Requests per Page", "reqHtml", 5) . "\n";
echo histogram($hCdf, "bytesHtml", "HTML Transfer Size per Page", "bytesHtml", 20*1024) . "\n";
echo histogram($hCdf, "reqJS", "JS Requests per Page", "reqJS", 5) . "\n";
echo histogram($hCdf, "bytesJS", "JS Transfer Size per Page", "bytesJS", 100*1024, 2) . "\n";
echo histogram($hCdf, "reqCSS", "CSS Requests per Page", "reqCSS", 2) . "\n";
echo histogram($hCdf, "bytesCSS", "CSS Transfer Size per Page", "bytesCSS", 10*1024, 2) . "\n";
echo histogram($hCdf, "reqImg", "Img Requests per Page", "reqImg", 20) . "\n";
echo histogram($hCdf, "bytesImg", "Img Transfer Size per Page", "bytesImg", 400*1024, 2) . "\n";
echo histogram($hCdf, "reqGif", "GIF Requests per Page", "reqGif", 5) . "\n";
echo histogram($hCdf, "bytesGif", "GIF Transfer Size per Page", "bytesGif", 10*1024, 2) . "\n";
echo histogram($hCdf, "reqJpg", "JPG Requests per Page", "reqJpg", 10) . "\n";
echo histogram($hCdf, "bytesJpg", "JPG Transfer Size per Page", "bytesJpg", 200*1024, 2) . "\n";
echo histogram($hCdf, "reqPng", "PNG Requests per Page", "reqPng", 5) . "\n";
echo histogram($hCdf, "bytesPng", "PNG Transfer Size per Page", "bytesPng", 50*1024, 2) . "\n";
echo histogram($hCdf, "reqFont", "Font Requests per Page", "reqFont", 2) . "\n";
echo histogram($hCdf, "bytesFont", "Font Transfer Size per Page", "bytesFont", 40*1024, 2) . "\n";
echo histogram($hCdf, "reqFlash", "Flash Requests per Page", "reqFlash", 2) . "\n";
echo histogram($hCdf, "bytesFlash", "Flash Transfer Size per Page", "bytesFlash", 50*1024) . "\n";
//echo histogram($hCdf, "reqJson", "JSON Requests per Page", "reqJson", 5) . "\n";
//echo histogram($hCdf, "bytesJson", "JSON Transfer Size per Page", "bytesJson", 1024) . "\n";
echo histogram($hCdf, "reqOther", "Other Requests per Page", "reqOther", 2) . "\n";
echo histogram($hCdf, "bytesOther", "Other Transfer Size per Page", "bytesOther", 5*1024) . "\n";
?>
</div>


<?php echo uiFooter() ?>

</body>

</html>

