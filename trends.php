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

$gArchive = "All";
$gLabel = ( array_key_exists("l", $_GET) ? $_GET["l"] : latestLabel($gArchive) );
$gTitle = "Trends";
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title>HTTP Archive - <?php echo $gTitle ?></title>
	<meta charset="UTF-8">
<style>
.chart { 
	border: 1px solid #BBB; 
	padding: 4px; 
	margin-bottom: 40px; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>

<h1>Trends</h1>

<div id=trends style="margin-top: 40px;">
<!-- trends.js will insert trends here -->
</div>
	
<?php
$aFields = array("onLoad",
				 "renderStart",
				 "PageSpeed",
				 "reqTotal",
				 "reqHtml",
				 "reqJS",
				 "reqCSS",
				 "reqImg",
				 "bytesTotal",
				 "bytesHtml",
				 "bytesJS",
				 "bytesCSS",
				 "bytesImg",
				 "numDomains"
				 );
$query = "select label";
foreach($aFields as $field) {
	$div = ( false === strpos($field, "bytes") ? 1 : 1024 );
	$query .= ", ROUND(AVG($field)/$div) as $field";
}
$query .= " from $gPagesTable where archive = '$gArchive' group by label;";
$result = doQuery($query);
$hStats = array();
while ( $row = mysql_fetch_assoc($result) ) {
	$hStats[$row['label']] = $row;
}
mysql_free_result($result);

$aLabels = archiveLabels($gArchive);
$labels = urlencode(implode("|", $aLabels));
foreach($aFields as $field) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$url = "http://chart.apis.google.com/chart?chxl=0:|$labels&chxt=x&chs=600x300&cht=lxy&chco=$color" .
		"&chd=t:-1|" . 
		fieldValues($field, $hStats, $aLabels, $min, $max) . 
		"&chxs=0,676767,11.5,0,lt,676767&chxtc=0,8&chm=N" . ( $suffix ? "**+$suffix" : "" ) .
		",$color,0,,12,,::8&chds=0,100,$min,$max&chts=$color,32&chtt=" . urlencode(fieldTitle($field)) . "&chls=2&chma=5,5,5,25";
	echo "<div style='margin: 40px 0 60px 0;'><img src=$url></div>\n";
}

$stats = $hStats[$gLabel];


function fieldValues($field, $hStats, $aLabels, &$min, &$max) {
	$aValues = array();
	foreach($aLabels as $label) {
		$aValues[] = $hStats[$label][$field];
	}
	$min = findScale($aValues, true);
	$max = findScale($aValues, false);

	return implode(",", $aValues);
}


function findScale($aValues, $bDown) {
	$minValue = min($aValues);
	$base = intval(pow(10, strlen("$minValue")-($bDown?1:0)));
	return $base;
}
?>

<?php echo uiFooter() ?>

<script>
/*
function showSnippets() {
	var parent = document.getElementById('trends');
	for ( var iSnippet = 0; iSnippet < gaSnippets.length; iSnippet++ ) {
		newSnippet = document.createElement('div');
		newSnippet.id = iSnippet;
		newSnippet.className = "ianswer";
		newSnippet.innerHTML = gaSnippets[iSnippet];
		parent.appendChild(newSnippet);
	}
}

var trendsjs = document.createElement('script');
trendsjs.src = "trends.js?l=<?php echo $gLabel ?>";
trendsjs.onload = showSnippets;
trendsjs.onreadystatechange = function() { if ( trendsjs.readyState == 'complete' || trendsjs.readyState == 'loaded' ) { showSnippets(); } };
document.getElementsByTagName('head')[0].appendChild(trendsjs);
*/
</script>

</body>

</html>

