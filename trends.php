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
$gSet = ( array_key_exists("s", $_GET) ? $_GET["s"] : "All" );
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


<div style="float: left;">
<form>
	<label>Choose URLs:</label>
	<select onchange='document.location="?s="+escape(this.options[this.selectedIndex].value)'>
	    <option value='All'<?php echo ( "constant" != $gSet ? " selected" : "" ) ?>> All
	    <option value='constant'<?php echo ( "constant" == $gSet ? " selected" : "" ) ?>> intersection
	</select>
</form>
</div>
<div>
</div>

<div id=trends style="margin-top: 80px;">
<!-- trends.js will insert trends here -->
</div>
	
<?php
$setWhere = "";
if ( "constant" === $gSet ) {
	// Find the set of URLs that are constant across all labels;
	$numLabels = doSimpleQuery("select count(distinct(label)) from $gPagesTable;");
	$query = "select url, count(label) as num from $gPagesTable group by url having num = $numLabels;";
	$result = doQuery($query);
	$aUrls = array();
	while ( $row = mysql_fetch_assoc($result) ) {
		$aUrls[] = $row['url'];
	}
	mysql_free_result($result);
	$setWhere = " and url in ('" . implode("','", $aUrls) . "')";
}

$aFields = array(
				 //"onLoad",
				 //"renderStart",
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
$query = "select label, count(*) as numurls";
foreach($aFields as $field) {
	$div = ( false === strpos($field, "bytes") ? 1 : 1024 );
	$query .= ", ROUND(AVG($field)/$div) as $field";
}

$query .= " from $gPagesTable where archive = '$gArchive'$setWhere group by label;";
$result = doQuery($query);
$hStats = array();
while ( $row = mysql_fetch_assoc($result) ) {
	$hStats[$row['label']] = $row;
}
mysql_free_result($result);

$aLabels = archiveLabels($gArchive, false);
$aAxisLabels = archiveLabels($gArchive, true, "n/j");
$labels = urlencode(implode("|", $aAxisLabels));
array_unshift($aFields, "numurls");
foreach($aFields as $field) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$url = "http://chart.apis.google.com/chart" .
		"?chd=t:-1|" . 
		fieldValues($field, $hStats, $aLabels, $min, $max) . 
		"&chxl=0:|$labels&chxt=x&chs=600x300&cht=lxy&chco=$color" .
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
	findScale($aValues, $min, $max);

	return implode(",", $aValues);
}


function findScale($aValues, &$min, &$max) {
	// Power of 10 less than the min - eg 4719 ==> 1000
	$min = 0;
	/* Do we ever want to change the min from 0?
	$minValue = min($aValues);
	if ( $minValue > 100 ) {
		$min = pow(10, strlen("$minValue")-1);
	}
	*/

	// Multiple of power of 10 less than max value - eg 4719 ==> 5000
	$max = 10;
	$maxValue = max($aValues);
	if ( $maxValue > 10 ) {
		$base = pow(10, strlen("$maxValue")-1);
		$max = $base * ceil($maxValue/$base);
	}
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

