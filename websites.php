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

$gLabel = getParam('l', latestLabel($gArchive));
$gChar = getParam('c', 'A');
$gLcChar = strtolower($gChar);
$gTitle = "Web Sites";
$gMaxUrls = 20000;
?>
<!doctype html>
<html>
<head>
<title><?php echo genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<form onsubmit="doSubmit(); return false;">
<div style="font-size: 1em;">
  <label style="vertical-align: baseline;">Find URL: </label>
  <input id="url" style="vertical-align: baseline; margin-left: 1em;" size=40/>
  <input type=submit value="Search" style="vertical-align: baseline; margin-left: 1em;">
</div>
</form>

<div id=urls>
</div>

<?php echo uiFooter() ?>

<script>
var inputUrl = document.getElementById("url");

function doSubmit() {
	loadScript("findurl.php?term=" + encodeURI(inputUrl.value) + "&jsonp=showResults");
	spinnerOn();
}


function showResults(aResults) {
	var sHtml = "";

	if ( aResults ) {
		for ( var i=0, len=aResults.length; i < len; i++ ) {
			var hResult = aResults[i];
			var url = hResult["label"];
			var value = hResult["value"];
			if ( 0 == value ) {
				sHtml = "<li style='margin-bottom: 1em;'> " + url + "\n" + sHtml;
				break;
			}
			var pageid = hResult["data-pageid"];
			sHtml += "<li> <a href='viewsite.php?pageid=" + pageid + "'>" + url + "\n";
		}
	}

	document.getElementById("urls").innerHTML = ( sHtml ? 
												  "<ul style='list-style-type: none;'>\n" + sHtml + "</ul>\n" :
												  "no results found" );
}


function spinnerOn() {
	document.getElementById("urls").innerHTML = "<img src='images/busy.gif'>";
}

</script>

</body>
</html>
