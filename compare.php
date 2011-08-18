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

$gTitle = "Compare Stats";
$gArchive = "All";

$run1 = $set1 = $run2 = $set2 = null;
if ( array_key_exists("r1", $_GET) && array_key_exists("s1", $_GET) ) {
	$run1 = $_GET["r1"];
	$set1 = $_GET["s1"];
}
if ( array_key_exists("r2", $_GET) && array_key_exists("s2", $_GET) ) {
	$run2 = $_GET["r2"];
	$set2 = $_GET["s2"];
}

function genForm($curLabel="", $curSet="") {
	global $gArchive, $gbMobile;
	$selectRun = selectArchiveLabel($gArchive, $curLabel, true, false);
	$selectSet = selectSlice($curSet);

	$sForm =<<<OUTPUT
<table cellpadding=0 cellspacing=0 border=0>
  <tr>
    <td> <label>Choose a run:</label> </td>
	<td> $selectRun </td>
    <td></td>
  </tr>

  <tr>
	<td> <label>Choose URLs:</label> </td>
	<td> $selectSet </td>
    <td>
      <input type=submit value="Get Charts">
    </td>
  </tr>
</table>
OUTPUT;

	return $sForm;
}
?>
<!doctype html>
<html>
<head>
<title><?php echo genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>

<script type="text/javascript">
function doSubmit(num) {
	var selectrun = document.getElementById("compare"+num).getElementsByTagName('select')[0];
	var selectset = document.getElementById("compare"+num).getElementsByTagName('select')[1];

	var script = document.createElement('script');
	script.src = "interesting-images.js?jsonp=interesting" + num + 
	    "&l=" + escape(selectrun.options[selectrun.selectedIndex].value) +
	    "&s=" + escape(selectset.options[selectset.selectedIndex].value) +
	    "";
	document.getElementsByTagName('head')[0].appendChild(script);
}

function interesting1(snippets) {
	update("interesting1", snippets);
}

function interesting2(snippets) {
	update("interesting2", snippets);
}

function update(id, snippets) {
	var elem = document.getElementById(id);
	if ( !elem || !snippets ) {
		return;
	}

	var sHtml = "";
	for ( var i=0, len=snippets.length; i < len; i++ ) {
		sHtml += "<div>" + snippets[i] + "</div>";
	}

	elem.innerHTML = sHtml;
}

function getLink() {
	var selectrun1 = document.getElementById("compare1").getElementsByTagName('select')[0];
	var selectset1 = document.getElementById("compare1").getElementsByTagName('select')[1];
	var selectrun2 = document.getElementById("compare2").getElementsByTagName('select')[0];
	var selectset2 = document.getElementById("compare2").getElementsByTagName('select')[1];

	var url = "compare.php?" +
	    "&r1=" + escape(selectrun1.options[selectrun1.selectedIndex].value) +
	    "&s1=" + escape(selectset1.options[selectset1.selectedIndex].value) +
	    "&r2=" + escape(selectrun2.options[selectrun2.selectedIndex].value) +
	    "&s2=" + escape(selectset2.options[selectset2.selectedIndex].value);
	document.location = url;
}
</script>

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


<a style="float: right; font-size: 0.9em; margin-right: 20px;" href="javascript:getLink()" title="generate full URL">get link</a>
<h1>Compare stats</h1>

<style>
TABLE { border: 0; width: auto; }
tr:nth-child(2n+1) td { background: none; }
TD { padding-top: 0; padding-bottom: 0; }
</style>


<table cellpadding=0 cellspacing=0 border=0>
  <tr>
    <td id=compare1>
      <form onsubmit="doSubmit('1'); return false;">
      <?php echo genForm($run1, $set1); ?>
      </form>

      <div id=interesting1 style="margin-top: 40px; min-width: 640px;">
      </div>
    </td>

    <td id=compare2>
      <form onsubmit="doSubmit('2'); return false;">
      <?php echo genForm($run2, $set2); ?>
      </form>

      <div id=interesting2 style="margin-top: 40px; min-width: 640px;">
      </div>
    </td>
  </tr>
</table>

<?php echo uiFooter() ?>

<script type="text/javascript">
<?php
if ( $run1 && $set1 ) {
	echo "doSubmit(1);\n";
}
if ( $run2 && $set2 ) {
	echo "doSubmit(2);\n";
}
?>
</script>

</body>

</html>

