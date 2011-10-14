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

$gTitle = "HTTP Archive";
?>
<!doctype html>
<html>
<head>	
<title><?php echo genTitle() ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
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
	margin-top: 30px;
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
<!-- chart will be inserted here -->
</div>
</td>
<td id=rightarrow class=arrow></td>
</table>
</center>

<script type="text/javascript">
// HTML strings for each image
var gaSnippets = new Array();

<?php
require_once("stats.inc");
require_once("charts.inc");
$hStats = getStats(latestLabel("All"), "All", ($gbMobile ? "iphone" : "IE8"));
?>
gaSnippets.push("<?php echo bytesContentTypeChart($hStats) ?>");
gaSnippets.push("<?php echo responseSizes($hStats) ?>");
gaSnippets.push("<?php echo percentGoogleLibrariesAPI($hStats) ?>");
gaSnippets.push("<?php echo percentFlash($hStats) ?>");
gaSnippets.push("<?php echo popularImageFormats($hStats) ?>");
gaSnippets.push("<?php echo maxage($hStats) ?>");
gaSnippets.push("<?php echo percentByProtocol($hStats) ?>");
gaSnippets.push("<?php echo requestErrors($hStats) ?>");
gaSnippets.push("<?php echo redirects($hStats) ?>");
gaSnippets.push("<?php echo correlationChart($hStats, "onLoad") ?>");
gaSnippets.push("<?php echo correlationChart($hStats, "renderStart") ?>");


// The DOM element that is created from each snippet.
var gaSnippetElems = new Array();
var curSnippet;

function showSnippet(parentId, bPrev) {
	var parent = document.getElementById(parentId);
	if ( ! parent ) {
		return;
	}

	var iSnippet = Math.floor(gaSnippets.length * Math.random());
	if ( curSnippet ) {
		iSnippet = parseInt(curSnippet.id)
		//fade(curSnippet, true);
		curSnippet.style.display = 'none';
	}

	iSnippet = ( bPrev ? iSnippet-1 : iSnippet+1 );
	if ( iSnippet >= gaSnippets.length ) {
		iSnippet = 0;
	}
	else if ( iSnippet < 0 ) {
		iSnippet = gaSnippets.length - 1;
	}

	var newSnippet = gaSnippetElems[iSnippet];
	if ( "undefined" === typeof(newSnippet) ) {
		newSnippet = document.createElement('div');
		newSnippet.id = iSnippet;
		gaSnippetElems[iSnippet] = newSnippet;
		newSnippet.innerHTML = "<a class=image-link href='interesting.php'>" + gaSnippets[iSnippet] + "</a>";
		var aPosition = findPos(parent);
		newSnippet.style.left = aPosition[0] + "px";
		newSnippet.style.top = aPosition[1] + "px";
		parent.appendChild(newSnippet);
	}
	else {
		newSnippet.style.display = "block";
	}

	curSnippet = newSnippet;
	fade(newSnippet);
}


function insertNav(parentId) {
	var arrow = document.getElementById('leftarrow');
	if ( arrow ) {
		arrow.innerHTML = "<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\", 1)'><img src='images/tri-lft-t-14x28.gif' width=14 height=28 border=0></a>";
	}

	arrow = document.getElementById('rightarrow');
	if ( arrow ) {
		arrow.innerHTML = "<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\")'><img src='images/tri-rt-t-14x28.gif' width=14 height=28 border=0></a>";
	}
}


// opacity is a number 0-100 inclusive
function fade(idOrElem, bOut) {
	var elem = idOrElem;
	if ( "string" === typeof(idOrElem) || "number" === typeof(idOrElem) ) {
		elem = document.getElementById(idOrElem);
	}
	if ( ! elem ) {
		return;
	}

	opacity = ( elem.style.opacity ? parseInt(elem.style.opacity * 100) : ( bOut ? 100 : 0 ) );
	opacity = ( bOut ? opacity - 10 : opacity + 10 );
	opacity = ( 100 < opacity ? 100 : ( 0 > opacity ? 0 : opacity ) );

	elem.style.opacity = opacity/100;
	elem.style.filter = "alpha(opacity = " + opacity + ")";

	if ( (bOut && 0 < opacity ) || ( !bOut && 100 > opacity) ) {
		setTimeout(function() { fade(elem, bOut); }, 50);
	}
	else if ( bOut ) {
		elem.style.display = "none";
	}
}


// from http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
}


function dprint(msg) {
	if ( "undefined" != typeof(console) ) {
		console.log(msg);
	}
}

showSnippet('interesting'); 
insertNav('interesting');
</script>

<?php echo uiFooter() ?>

</body>
</html>
