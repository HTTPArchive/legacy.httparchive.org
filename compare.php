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

$gTitle = "Compare Stats";
$gArchive = "All";

function genForm() {
	global $gArchive, $gbMobile;
	$selectRun = selectArchiveLabel($gArchive, "", true, false);

	$top1000 = ( $gbMobile ? "" : "<option value='Top1000'> Top 1000" );

	$sForm =<<<OUTPUT
<table cellpadding=0 cellspacing=0 border=0>
  <tr>
    <td> <label>Choose a run:</label> </td>
	<td> $selectRun </td>
    <td></td>
  </tr>

  <tr>
	<td> <label>Choose URLs:</label> </td>
	<td> 
      <select>
	    <option value='All'> All
	    <option value='intersection'> intersection
	    <option value='Top100'> Top 100
        $top1000
      </select>
    </td>
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
      <?php echo genForm(); ?>
      </form>

      <div id=interesting1 style="margin-top: 40px; min-width: 640px;">
      </div>
    </td>

    <td id=compare2>
      <form onsubmit="doSubmit('2'); return false;">
      <?php echo genForm(); ?>
      </form>

      <div id=interesting2 style="margin-top: 40px; min-width: 640px;">
      </div>
    </td>
  </tr>
</table>

<?php echo uiFooter() ?>

</body>

</html>

