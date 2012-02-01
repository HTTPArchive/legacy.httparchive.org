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

$gTitle = "Batch Runs";
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
DD { margin-left: 40px; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>
<h1><?php echo $gTitle ?></h1>

<p>
Here are the most recent URLs collected:
</p>

<div id="urls" style="border: 2px solid #999; padding: 8px;">
</div>
<div id=spinner style="visibility: hidden; text-align: center;">
<img src="images/busy.gif">
</div>

<script type="text/javascript">
var gFirstPageid, gLastPageid;

function addUrls(aUrls) {
	sHtml = "";
	for ( var i = 0; i < aUrls.length; i++ ) {
		var aUrl = aUrls[i];
		if ( ! gFirstPageid ) {
			gFirstPageid = aUrl[0];
		}
		// TODO: hmmm - We can't push this to production because the crawl is done in dev and the results are 
		// copied in bulk when all done. Later we should investigate copying the results as the crawl progresses.
		// For now, we'll watch the dev databases but NOT link to the results.
		// sHtml += "<code style='font-size: 0.9em'>" + formatDate(aUrl[1]) + "</code> <a href='viewsite.php?pageid=" + aUrl[0] + "'>" +
		sHtml += "<code style='font-size: 0.9em'>" + formatDate(aUrl[1]) + "</code> " +
			aUrl[2] +
			( aUrl[3] ? " - " + aUrl[3] : "" ) +
			"<br>\n";
		gLastPageid = aUrl[0];
	}

	document.getElementById("urls").innerHTML += sHtml;
}


var gbFetching = false;

function fetchUrls(n) {
	if ( ! gbFetching ) {
		gbFetching = true;
		document.getElementById('spinner').style.visibility = "visible";
		n = n || 50;
		var s = document.createElement("script");
		s.onload = function() { gbFetching = false; document.getElementById('spinner').style.visibility = "hidden"; };
		s.src = "runs.js?pageid=" + gLastPageid + "&n=" + n;
		document.getElementsByTagName("head")[0].appendChild(s);
	}
}


var gaMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(epoch) {
	var d = new Date(1000 * epoch);
	var sDate = gaMonths[d.getMonth()] + " " + d.getDate() + " " + lpad(d.getHours(),2,"0") + ":" + 
		lpad(d.getMinutes(),2,"0") + ":" + lpad(d.getSeconds(),2,"0");
	return sDate;
}


function lpad(s, n, c) {
	c = c || " ";
	return (c + c + c + c + s).slice(-n);
}


window.onscroll = function() {
	if ( (window.scrollY + window.innerHeight + 400) > document.body.scrollHeight ) {
		fetchUrls();
	}
};

<?php 
require_once("runs.js");
?>

// prefetch
fetchUrls(100);
</script>

<?php echo uiFooter() ?>

</body>

</html>

