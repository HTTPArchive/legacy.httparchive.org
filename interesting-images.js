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

require_once("utils.php");

/*
DESCRIPTION: 
Return a JavaScript file that contains code for creating
rotating divs of interesting stats.
*/

// Add the label to the cached filename.
$gArchive = "All";
if ( $argc ) {
	// Handle commandline arguments when we're creating cached files from a script.
	$gLabel = $argv[1];
}
else {
	// Otherwise, get the label from the querystring.
	$gLabel = getParam('l', latestLabel($gArchive));
}

// Add the revision # to the cached filename.
$gRev = '$Rev: 355 $';
if ( ereg('Rev: ([0-9]*) ', $gRev, $regs) ) {
	$gRev = $regs[1];
}

function onloadCorrelation() {
	return findCorrelation("onLoad", "load", "Highest Correlation to Load Time");
}


function renderCorrelation() {
	return findCorrelation("renderStart", "render", "Highest Correlation to Render Time", "7777CC");
}


function findCorrelation($var1, $tname, $title, $color="80C65A") {
	global $gPagesTable, $gRequestsTable, $ghColumnTitles;
	global $gArchive, $gLabel;

	// TODO - make this more flexible
	$aVars = array("PageSpeed", "reqTotal", "reqHtml", "reqJS", "reqCSS", "reqImg", "reqFlash", "reqJson", "reqOther", "bytesTotal", "bytesHtml", "bytesJS", "bytesCSS", "bytesImg", "bytesFlash", "bytesJson", "bytesOther", "numDomains");
	$hCC = array();
	foreach ($aVars as $var2) {
		// from http://www.freeopenbook.com/mysqlcookbook/mysqlckbk-chp-13-sect-6.html
		$cmd = "SELECT @n := COUNT($var1) AS n, @sumX := SUM($var2) AS 'sumX', @sumXX := SUM($var2*$var2) 'sumXX', @sumY := SUM($var1) AS 'sumY', @sumYY := SUM($var1*$var1) 'sumYY', @sumXY := SUM($var2*$var1) AS 'sumXY' FROM $gPagesTable where archive='$gArchive' and label='$gLabel' and $var2 is not null and $var2 > 0;";
		$row = doRowQuery($cmd);
		$n = $row['n'];
		if ( $n ) {
			$sumX = $row['sumX'];
			$sumXX = $row['sumXX'];
			$sumY = $row['sumY'];
			$sumYY = $row['sumYY'];
			$sumXY = $row['sumXY'];
			$cc = (($n*$sumXY) - ($sumX*$sumY)) / sqrt( (($n*$sumXX) - ($sumX*$sumX)) * (($n*$sumYY) - ($sumY*$sumY)) );
			// I want to sort the results by correlation coefficient ($cc),
			// so I use $cc as the hash key. But, $cc is not unique 
			// (it's possible for two variables to have the same $cc).
			// So the value for each hash entry is an array of variable name(s).
			if ( ! array_key_exists("$cc", $hCC) ) {
				$hCC["$cc"] = array();
			}
			array_push($hCC["$cc"], $var2);
		}
	}

	$aCC = array_keys($hCC);
	rsort($aCC, SORT_NUMERIC);
	$iRows = 0;
	$aVarNames = array();
	$aVarValues = array();
	foreach($aCC as $cc) {
		$prettyCC = round($cc*100)/100;
		foreach($hCC[$cc] as $var2) {
			array_push($aVarNames, $ghColumnTitles[$var2]);
			array_push($aVarValues, $prettyCC);
			$iRows++;
			if ( 5 <= $iRows ) {
				break;
			}
		}
		if ( 5 <= $iRows ) {
			break;
		}
	}

	return correlationColumnChart($title, $aVarNames, $aVarValues, $color);
}


function redirects() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel, $gTotal;

	$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and status >= 300 and status < 400 and status != 304;");
	$yes = round(100*$num/$gTotal);
	$no = 100-$yes;
	$aVarNames = array("No Redirects $no%", "Redirects $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages with Redirects (3xx)", $aVarNames, $aVarValues, "008000");
}


function percentJson() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$sHtml = "<div class=itagline>pages using JSON:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and resp_content_type like '%json%';");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function requestErrors() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel, $gTotal;

	$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and status >= 400 and status < 600;");
	$yes = round(100*$num/$gTotal);
	$no = 100-$yes;
	$aVarNames = array("No Errors $no%", "Errors $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages with Request Errors (4xx, 5xx)", $aVarNames, $aVarValues, "B09542");
}


function responseSizes() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$gif = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%image/gif%';") );
	$jpg = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');") );
	$png = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%image/png%';") );
	$js = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%script%';") );
	$css = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%css%';") );
	$flash = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%flash%';") );
	$html = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%html%';") );

	$aVarNames = array("GIF", "JPEG", "PNG", "HTML", "JS", "CSS", "Flash");
	$aVarValues = array($gif, $jpg, $png, $html, $js, $css, $flash);

	return horizontalBarChart("Avg Individual Resource Response Size", $aVarNames, $aVarValues, "3B356A", 0, max(array($gif, $jpg, $png, $html, $js, $css, $flash))+10, 
							  "average response size (kB)", false, "+kB");
}


function popularImageFormats() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$total = doSimpleQuery("select count(*) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%image%';");
	$gif = round( 100*doSimpleQuery("select count(*) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%image/gif%';") / $total);
	$jpg = round( 100*doSimpleQuery("select count(*) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');") / $total);
	$png = round( 100*doSimpleQuery("select count(*) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%image/png%';") / $total);

	$aVarNames = array("GIF $gif%", "JPEG $jpg%", "PNG $png%");
	$aVarValues = array($gif, $jpg, $png);

	return pieChart("Image Formats", $aVarNames, $aVarValues, "E94E19");
}


function bytesContentType() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$row = doRowQuery("select avg(bytesTotal) as total, avg(bytesHtml) as html, avg(bytesJS) as js, avg(bytesCSS) as css, avg(bytesImg) as img, avg(bytesFlash) as flash, avg(bytesJson) as json, avg(bytesOther) as other from $gPagesTable where archive='$gArchive' and label='$gLabel';");
	$total = $row['total'];
	$aVarValues = array( formatSize($row['html']), formatSize($row['img']), formatSize($row['js']), 
						 formatSize($row['css']), formatSize($row['flash']), formatSize($row['json']+$row['other']) );
	$aVarNames = array("HTML - " . $aVarValues[0] . " kB", "Images - " . $aVarValues[1] . " kB", "Scripts - " . $aVarValues[2] . " kB", 
					   "Stylesheets - " . $aVarValues[3] . " kB", "Flash - " . $aVarValues[4] . " kB", "Other - " . $aVarValues[5] . " kB");
	return pieChart("Average Bytes per Page by Content Type", $aVarNames, $aVarValues, "007099");
}


function percentFlash() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel, $gTotal;

	$num = doSimpleQuery("select count(*) from $gPagesTable where archive='$gArchive' and label='$gLabel' and reqFlash > 0;");
	$yes = round(100*$num/$gTotal);
	$no = 100-$yes;
	$aVarNames = array("No Flash $no%", "Flash $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Flash", $aVarNames, $aVarValues, "AA0033");
}


function popularScripts() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel, $gTotal;

	$result = doQuery("select $gRequestsTable.url, count(distinct $gPagesTable.pageid) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%script%' group by $gRequestsTable.url order by num desc limit 5;");

	$aVarNames = array();
	$aVarValues = array();
	while ($row = mysql_fetch_assoc($result)) {
		$url = $row['url'];
		$num = $row['num'];
		array_push($aVarNames, $url);
		array_push($aVarValues, round(100*$num/$gTotal));
	}
	mysql_free_result($result);

	return horizontalBarChart("Most Popular Scripts", $aVarNames, $aVarValues, "1D7D61", 0, 100, "sites using the script", true, "%");
}




function jsLibraries() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel, $gTotal;

	$hCond = array();
	$hCond["jQuery"] = "$gRequestsTable.url like '%jquery%'";
	$hCond["YUI"] = "$gRequestsTable.url like '%/yui/%'";
	$hCond["Dojo"] = "$gRequestsTable.url like '%dojo%'";
	$hCond["Google Analytics"] = "($gRequestsTable.url like '%/ga.js%' or $gRequestsTable.url like '%/urchin.js%')";
	$hCond["Quantcast"] = "$gRequestsTable.url like '%quant.js%'";
	$hCond["AddThis"] = "$gRequestsTable.url like '%addthis.com%'";
	$hCond["Facebook"] = "($gRequestsTable.url like '%facebook.net/%' or $gRequestsTable.url like '%fbcdn.net/%' or $gRequestsTable.url like '%connect.facebook.com/%')";
	$hCond["Twitter"] = "$gRequestsTable.url like '%twitter%'";
	$hCond["ShareThis"] = "$gRequestsTable.url like '%sharethis%'";

	$aVarNames = array();
	$aVarValues = array();
	foreach (array_keys($hCond) as $key) {
		$cond = $hCond[$key];
		array_push($aVarNames, $key);
		array_push($aVarValues, round( 100*doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable where archive='$gArchive' and label='$gLabel' and $gRequestsTable.pageid=$gPagesTable.pageid and resp_content_type like '%script%' and $cond;") / $gTotal ));
	}

	return horizontalBarChart("Popular JavaScript Libraries", $aVarNames, $aVarValues, "3399CC", 0, 100, "sites using the JS library", true, "%");
}


function percentGoogleLibrariesAPI() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel, $gTotal;

	$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable where archive='$gArchive' and label='$gLabel' and $gRequestsTable.pageid=$gPagesTable.pageid and $gRequestsTable.url like '%googleapis.com%';");
	$yes = round(100*$num/$gTotal);
	$no = 100-$yes;
	$aVarNames = array("no $no%", "yes $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Google Libraries API", $aVarNames, $aVarValues, "7777CC");
}


function mostJS() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$result = doQuery("select url, bytesJS from $gPagesTable where archive='$gArchive' and label='$gLabel' order by bytesJS desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, $row['url']);
		array_push($aVarValues, round($row['bytesJS']/1024));
		if ( ! $maxValue ) {
			$maxValue = round($row['bytesJS']/1024);
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, round(doSimpleQuery("select avg(bytesJS) from $gPagesTable where archive='$gArchive' and label='$gLabel';")/1024));

	return horizontalBarChart("Pages with the Most JavaScript", $aVarNames, $aVarValues, "B4B418", 0, $maxValue+100, "size of all scripts (kB)", false, "+kB");
}


function mostCSS() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$result = doQuery("select url, bytesCSS from $gPagesTable where archive='$gArchive' and label='$gLabel' order by bytesCSS desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, $row['url']);
		array_push($aVarValues, round($row['bytesCSS']/1024));
		if ( ! $maxValue ) {
			$maxValue = round($row['bytesCSS']/1024);
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, round(doSimpleQuery("select avg(bytesCSS) from $gPagesTable where archive='$gArchive' and label='$gLabel';")/1024));

	return horizontalBarChart("Pages with the Most CSS", $aVarNames, $aVarValues, "CF557B", 0, $maxValue+100, "size of all stylesheets (kB)", false, "+kB");
}


function mostFlash() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$result = doQuery("select url, reqFlash from $gPagesTable where archive='$gArchive' and label='$gLabel' order by reqFlash desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, $row['url']);
		array_push($aVarValues, $row['reqFlash']);
		if ( ! $maxValue ) {
			$maxValue = $row['reqFlash'];
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, doSimpleQuery("select avg(reqFlash) from $gPagesTable where archive='$gArchive' and label='$gLabel';"));

	return horizontalBarChart("Pages with the Most Flash Files", $aVarNames, $aVarValues, "AA0033", 0, $maxValue+10);
}


function pieChart($title, $aNames, $aValues, $color="007099") {
	return "<img class=chart src='http://chart.apis.google.com/chart?chs=400x225&cht=p&chco=$color&chd=t:" .
		implode(",", $aValues) .
		chdsMinmax($aValues) .
		"&chl=" .
		urlencode(implode("|", $aNames)) .
		"&chma=|5&chtt=" . urlencode($title) . "'>";
}


// The chd (data) param in text ("t:") format only allows values from 0-100.
// You have to use the chds param if you have values outside that range.
function chdsMinmax($aValues) {
	$chds = "";
	if ( count($aValues) ) {
		$min = min($aValues);
		$max = max($aValues);
		if ( $min < 0 || $max > 100 ) {
			$chds = "&chds=$min,$max";
		}
	}

	return $chds;
}


function percentageColumnChart($title, $aNames, $aValues, $color="80C65A") {
	return "<img class=chart src='http://chart.apis.google.com/chart?chxl=0:|20%25|40%25|60%25|80%25|100%25|1:|" .
		urlencode(implode("|", $aNames)) .
		"&chxp=0,20,40,60,80,100&chxs=0,$color,11.5,0,lt,$color|1,676767,11.5,0,lt,67676700&chxtc=0,4|1,4&chxt=y,x&chbh=60,30,20&chs=300x225&cht=bvg&chco=$color&chd=t:" .
		implode(",", $aValues) .
		"&chtt=" . urlencode($title) . ">";
}


function correlationColumnChart($title, $aNames, $aValues, $color="80C65A") {
	return "<img class=chart src='http://chart.apis.google.com/chart?chxl=1:|" .
		str_replace("Requests", "Reqs", str_replace("Transfer", "Xfer", urlencode(implode("|", $aNames)))) .
		"&chxr=0,0,1&chxs=1,676767,11.5,0,lt,67676700&chxtc=1,5&chxt=y,x&chbh=60,30,30&chs=500x225&cht=bvg&chco=$color&chds=0,1&chd=t:" .
		implode(",", $aValues) .
		"&chm=N,676767,0,,12,,::4&chtt=" . urlencode($title) . "'>";
}


function horizontalBarChart($title, $aNames, $aValues, $color="80C65A", $min, $max, $xtitle = "", $bPercentage = false, $markSuffix = "") {
	return "<img class=chart src='http://chart.apis.google.com/chart?" .
		( $bPercentage ? "chxp=0,20,40,60,80,100&chxl=0:|20%|40%|60%|80%|100%|1:|" : "chxl=1:|" ) .
		urlencode(implode("|", array_reverse($aNames))) .
		( $xtitle ? "&chdlp=b&chdl=$xtitle" : "" ) .
		"&chxtc=0,6&chxs=0,676767,11.5,0,l|1,676767,11.5,1,lt,67676700&chxr=1,0,160|0,$min,$max&chxt=x,y&chbh=22&chs=640x" .
		( count($aValues) > 7 ? 370 : ( count($aValues) > 5 ? 260 : 220 ) ) . "&cht=bhg&chco=$color&chds=$min,$max&chd=t:" .
		implode(",", $aValues) .
		"&chm=N**$markSuffix,676767,0,,12,,:4:&chma=|0,5&chtt=" . urlencode($title) . "'>";
}



$gCacheFile = "./cache/interesting.js.$gRev.$gLabel.cache";
$snippets = "";

if ( file_exists($gCacheFile) ) {
	$snippets = file_get_contents($gCacheFile);
}

if ( ! $snippets ) {
	// Saves a little time since we use the # of pages frequently.
	$gTotal = doSimpleQuery("select count(*) from $gPagesTable where archive='$gArchive' and label='$gLabel';");

	$aSnippetFunctions = array(
							   "bytesContentType",
							   "responseSizes",
							   "jsLibraries",
							   "popularScripts",
							   "percentGoogleLibrariesAPI",
							   "mostJS",

							   "mostCSS",

							   "percentFlash",
							   "mostFlash",

							   "popularImageFormats",

							   "requestErrors",
							   "redirects",
							   "onloadCorrelation",
							   "renderCorrelation"
							   );
	$snippets = "";
	foreach($aSnippetFunctions as $func) {
		$snippets .= 'gaSnippets.push("' . call_user_func($func) . '");' . "\n";
	}
	// This won't work for web site users because of permissions.
	// Run "php interesting.js" from the commandline to generate the cache file.
	// I'll leave this line generating errors as a reminder to create the cache file.
	file_put_contents($gCacheFile, $snippets);
}
?>

// HTML strings for each image
var gaSnippets = new Array();

<?php
echo $snippets;
?>

