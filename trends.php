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
$gLabel = getParam('l', latestLabel($gArchive));
$gSet = getParam('s', 'All');
$gTitle = "Trends";
?>
<!doctype html>
<html>
<head>
<title>HTTP Archive - <?php echo $gTitle ?></title>
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

<h1>Trends</h1>


<div style="float: left; margin-right: 20px;">
<form>
	<label>Choose URLs:</label>
	<select onchange='document.location="?s="+escape(this.options[this.selectedIndex].value)'>
	    <option value='All'<?php echo ( "intersection" != $gSet ? " selected" : "" ) ?>> All
	    <option value='intersection'<?php echo ( "intersection" == $gSet ? " selected" : "" ) ?>> intersection
	</select>
</form>
</div>
<div style="font-size: 0.9em;">
<?php
if ( "intersection" != $gSet ) {
	echo "use \"intersection\" to trend the exact same URLs over time";
}
?>
</div>

<div id=trends style="margin-top: 80px;">
<!-- trends.js will insert trends here -->
</div>
	
<?php
// The database fields we want to plot.
$aFields = array(
				 //"onLoad",
				 //"renderStart",
				 "PageSpeed",
				 "reqTotal",
				 "reqHtml",
				 "reqJS",
				 "reqCSS",
				 "reqImg",
				 "reqFlash",
				 "bytesTotal",
				 "bytesHtml",
				 "bytesJS",
				 "bytesCSS",
				 "bytesImg",
				 "bytesFlash",
				 "numDomains"
				 );



// Intersection or All?
$setWhere = "";
if ( "intersection" === $gSet ) {
	// Find the set of URLs that are constant across all labels;
	$numLabels = doSimpleQuery("select count(distinct(label)) from $gPagesTable where $gDateRange;");
	$query = "select url, count(label) as num from $gPagesTable where $gDateRange group by url having num = $numLabels;";
	$result = doQuery($query);
	$aUrls = array();
	while ( $row = mysql_fetch_assoc($result) ) {
		$aUrls[] = $row['url'];
	}
	mysql_free_result($result);
	$setWhere = " and url in ('" . implode("','", $aUrls) . "')";
}

// Build the query to pull the stats for ALL fields for ALL labels, for example:
//   select label, count(*) as numurls, ROUND(AVG(PageSpeed)/1) as PageSpeed, ROUND(AVG(reqTotal)/1) as reqTotal, ROUND(AVG(reqHtml)/1) as reqHtml, 
//     ROUND(AVG(reqJS)/1) as reqJS, ROUND(AVG(reqCSS)/1) as reqCSS, ROUND(AVG(reqImg)/1) as reqImg, ROUND(AVG(bytesTotal)/1024) as bytesTotal, 
//     ROUND(AVG(bytesHtml)/1024) as bytesHtml, ROUND(AVG(bytesJS)/1024) as bytesJS, ROUND(AVG(bytesCSS)/1024) as bytesCSS, 
//     ROUND(AVG(bytesImg)/1024) as bytesImg, ROUND(AVG(numDomains)/1) as numDomains from pagesdev where archive = 'All' group by label;
$query = "select label, count(*) as numurls";
foreach($aFields as $field) {
	$divisor = ( false === strpos($field, "bytes") ? 1 : 1024 );
	$query .= ( ("reqFlash" === $field || "reqHtml" === $field || "reqCSS" === $field) ? ", TRUNCATE(AVG($field), 1) as $field" : ", ROUND(AVG($field)/$divisor) as $field" );
}
$query .= " from $gPagesTable where archive = '$gArchive'$setWhere and $gDateRange group by label;";
$result = doQuery($query);

// Separate the stats by label.
$hStats = array();
while ( $row = mysql_fetch_assoc($result) ) {
	$hStats[$row['label']] = $row;
}
mysql_free_result($result);

// Create a chart for each field.
$aRunNames = archiveLabels($gArchive, false);
$aAxisLabels = archiveLabels($gArchive, true, "n/j");
$labels = urlencode(implode("|", $aAxisLabels));

// show URLs first so people can see if they're doing intersection or not
echo formatChart('numurls', $hStats, $aRunNames, $labels);

echo format2LineChart('reqTotal', 'bytesTotal', $hStats, $aRunNames, $labels);
echo format2LineChart('reqHtml', 'bytesHtml', $hStats, $aRunNames, $labels);
echo format2LineChart('reqJS', 'bytesJS', $hStats, $aRunNames, $labels);
echo format2LineChart('reqCSS', 'bytesCSS', $hStats, $aRunNames, $labels);
echo format2LineChart('reqImg', 'bytesImg', $hStats, $aRunNames, $labels);
echo format2LineChart('reqFlash', 'bytesFlash', $hStats, $aRunNames, $labels);

foreach(array('PageSpeed', 'numDomains') as $field) {
	echo formatChart($field, $hStats, $aRunNames, $labels);
}


function format2LineChart($field, $field2, $hStats, $aRunNames, $labels) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$color2 = fieldColor($field2);
	$suffix2 = fieldUnits($field2);

	$fieldVals = fieldValues($field, $hStats, $aRunNames, $min, $max, false);
	$max = intval(intval($max)*1.5);
	$step = ( $max > 200 ? 100 : ( $max > 100 ? 20 : 10 ) );
	$fieldVals2 = fieldValues($field2, $hStats, $aRunNames, $min2, $max2, false);
	$step2 = ( $max2 > 200 ? 100 : ( $max2 > 100 ? 20 : 10 ) );
	$url = "http://chart.apis.google.com/chart" .
		"?chd=t:-1|$fieldVals|-1|$fieldVals2" .
		"&chxl=0:|$labels" .
		"&chxt=x,y,r" .
		"&chs=600x300" .
		"&cht=lxy" .
		"&chco=$color,$color2" .
		"&chm=N" . ( $suffix ? "**+$suffix" : "" ) . ",$color,0,,12,,:-8:8" . "|N" . ( $suffix2 ? "**$suffix2" : "" ) . ",$color2,1,,12,,:-16:8" .
		"&chds=9,99,$min,$max,9,99,$min2,$max2" .
		"&chts=$color2,24" .
		"&chtt=" . urlencode(fieldTitle($field2)) . "+%26+" . urlencode(fieldTitle($field)) . 
		"&chma=5,5,5,25" .
		"&chls=1,6,3|1" .
		"&chxr=1,$min2,$max2,$step2|2,$min,$max,$step" .
		"&chxs=1,$color2,11.5,-0.5,lt,$color2,$color2|2,$color,11.5,-0.5,lt,$color,$color" .
		"&chxtc=0,4|1,4" .
		"&chxp=0&chdl=" . urlencode(fieldTitle($field)) . "|" . urlencode(fieldTitle($field2)) . "+(kB)&chdlp=bv|r" .
		"";

	return "<div style='margin: 40px 0 60px 0;'><img src=$url></div>\n";
}


function formatChart($field, $hStats, $aRunNames, $labels) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$url = "http://chart.apis.google.com/chart" .
		"?chd=t:-1|" . fieldValues($field, $hStats, $aRunNames, $min, $max) . 
		"&chxl=0:|$labels&chxt=x&chs=600x300&cht=lxy&chco=$color" .
		"&chxs=0,676767,11.5,0,lt,676767&chxtc=0,8&chm=N" . ( $suffix ? "**+$suffix" : "" ) .
		",$color,0,,12,,::8&chds=0,100,$min,$max&chts=$color,32&chtt=" . urlencode(fieldTitle($field)) . "&chls=2&chma=5,5,5,25";
	return "<div style='margin: 40px 0 60px 0;'><img src=$url></div>\n";
}


function fieldValues($field, $hStats, $aRunNames, &$min, &$max, $bZero = true) {
	$aValues = array();
	foreach($aRunNames as $run) {
		$aValues[] = $hStats[$run][$field];
	}
	findScale($aValues, $min, $max, $bZero);

	return implode(",", $aValues);
}


function findScale($aValues, &$min, &$max, $bZero = true) {
	$minValue = min($aValues);
	$maxValue = max($aValues);

	// Power of 10 less than the min - eg 4719 ==> 4000
	$min = 0;
	if ( ! $bZero && 20 < $minValue ) {
		$base = pow(10, strlen("$minValue")-1);
		$min = $base * intval(floor($minValue/$base)-1);
	}

	// Multiple of power of 10 less than max value - eg 4719 ==> 5000
	$max = 10;
	if ( $maxValue > 10 ) {
		$base = pow(10, strlen("$maxValue")-1);
		$max = $base * intval(ceil($maxValue/$base));
	}
}
?>



<?php echo uiFooter() ?>

</body>

</html>

