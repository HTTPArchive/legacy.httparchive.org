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

$gArchive = ( array_key_exists("a", $_GET) ? $_GET["a"] : "" );
$gTitle = $gArchive . " URLs";
?>
<!doctype html>
<html>

<head>
<title><?php echo $gTitle ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
</head>

<body>

<?php echo uiHeader($gTitle); ?>

<table border=0 cellpadding=0 cellspacing=0 style="margin-top: 10px;">
<tr>
<td>
choose an archive:
<select onchange="document.location='urls.php?a='+escape(this.options[this.selectedIndex].value)">
  <option>
<?php
$aNames = archiveNames();
for ( $i = 0; $i < count($aNames); $i++ ) {
	$name = $aNames[$i];
	echo "  <option value='$name'" . ( $name == $gArchive ? " selected" : "" ) . ">$name\n";
}
?>
</select>
</td>
<td style="padding-left: 10px;">
<?php
if ( $gArchive ) {
	echo "<div style='font-size: 0.8em;'><a href='viewarchive.php?a=$gArchive'>back to stats</a></div>\n";
}
?>
</td>
</tr>
</table>


<p>
<?php echo sourceLink($gArchive) ?> list of URLs:
</p>
<ol style="font-size: 0.9em;">
<?php
if ( $gArchive ) {
	$sUrls = file_get_contents("./lists/$gArchive.txt");
	$aUrls = explode("\n", $sUrls);
	for ( $i = 0; $i < count($aUrls); $i++ ) {
		$url = $aUrls[$i];
		if ( $url ) {
			echo "  <li> " . siteLink($url) . "\n";
		}
	}
}
?>
</ol>

<?php echo uiFooter() ?>

</body>
</html>
<?php
function sourceLink($archive) {
	$url = "";
	if ( "Alexa 500" == $archive ) {
		$url = "http://www.alexa.com/topsites";
	}
	else if ( "Alexa US 100" == $archive ) {
		$url = "http://www.alexa.com/topsites/countries/US";
	}
	else if ( "Alexa US 500" == $archive ) {
		$url = "http://www.alexa.com/topsites/countries/US";
	}
	else if ( "Fortune 500" == $archive ) {
		$url = "http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/";
	}
	else if ( "Fortune 1000" == $archive ) {
		$url = "http://s3.amazonaws.com/alexa-static/top-1m.csv.zip";
	}
	else if ( "Global 500" == $archive ) {
		$url = "http://money.cnn.com/magazines/fortune/global500/2010/full_list/";
	}

	if ( $url ) {
		return "<a href='$url'>$archive</a>";
	}
	else {
		return $archive;
	}
}
?>
