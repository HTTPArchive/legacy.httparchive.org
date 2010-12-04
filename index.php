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
require_once("utils.php");

$gTitle = "HTTP Archive";
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title><?php echo $gTitle ?></title>
	<meta charset="UTF-8">
	
<style>
.column {
	float: left;
	width: 50%; }
h2 {
	clear: both; }
.arrow { 
	vertical-align: top;
	padding-top: 100px; }
#rightarrow {
	text-align: left; }
#interestingcontainer {
	margin-top: 80px;
	width: auto; 
	border: 0; }
</style>
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<p class="summary">The <a href="about.php">HTTP Archive</a> tracks how the Web is built.</p>

<ul class="even-columns keypoints">
  <li><strong><a href="trends.php">Trends in web technology</a></strong><br>load times, download sizes, performance scores
  <li><strong><a href="interesting.php">Interesting stats</a></strong><br>popular scripts, image formats, errors, redirects
  <li><strong><a href="websites.php">Website performance</a></strong><br>specific URL screenshots, waterfall charts, HTTP headers
</ul>

The <a href="http://code.google.com/p/httparchive/source/checkout">HTTP Archive code</a> is open source and the data is <a href="downloads.php">downloadable</a>.


<center>
<table id=interestingcontainer cellspacing=0 cellpadding=0 border=0>
<tr>
<td id=leftarrow class=arrow></td>
<td>
<div id=interesting>
<!-- interesting.js will insert interesting stats here -->
</div>
</td>
<td id=rightarrow class=arrow></td>
</table>
</center>

<script type="text/javascript">
var interestingjs = document.createElement('script');
interestingjs.src = "interesting.js";
interestingjs.onload = function() { showSnippet('interesting'); insertNav('interesting'); };
interestingjs.onreadystatechange = function() { if ( interestingjs.readyState == 'complete' || interestingjs.readyState == 'loaded' ) { showSnippet('interesting'); insertNav('interesting'); } };
document.getElementsByTagName('head')[0].appendChild(interestingjs);
</script>

<?php echo uiFooter() ?>

</body>
</html>
