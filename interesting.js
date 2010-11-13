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

$gArchive = "All";
$gLabel = latestLabel($gArchive);

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
		$cmd = "SELECT @n := COUNT($var1) AS N, @sumX := SUM($var2) AS 'X sum', @sumXX := SUM($var2*$var2) 'X sum of squares', @sumY := SUM($var1) AS 'Y sum', @sumYY := SUM($var1*$var1) 'Y sum of square', @sumXY := SUM($var2*$var1) AS 'X*Y sum' FROM $gPagesTable where archive='$gArchive' and label='$gLabel' and $var2 is not null and $var2 > 0;";
		doSimpleCommand($cmd);
		$query = "SELECT (@n*@sumXY - @sumX*@sumY) / SQRT((@n*@sumXX - @sumX*@sumX) * (@n*@sumYY - @sumY*@sumY)) AS correlation;";
		$cc = doSimpleQuery($query);

		// I want to sort the results by correlation coefficient ($cc),
		// so I use $cc as the hash key. But, $cc is not unique 
		// (it's possible for two variables to have the same $cc).
		// So the value for each hash entry is an array of variable name(s).
		if ( ! array_key_exists($cc, $hCC) ) {
			$hCC[$cc] = array();
		}
		array_push($hCC[$cc], $var2);
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
	global $gArchive, $gLabel;

	// get redirects for each label
	$result = doQuery("select label, count(distinct $gPagesTable.pageid) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and status >= 300 and status < 400 group by label order by $gPagesTable.startedDateTime asc;");
	$aVarNames = array();
	$hNum = array();
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, $row['label']);
		$hNum[$row['label']] = $row['num'];
	}
	mysql_free_result($result);

	// get totals for each label
	$result = doQuery("select label, count(*) as total from $gPagesTable where archive='$gArchive' group by label order by startedDateTime asc;");
	$aVarValues = array();
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarValues, round((100*$hNum[$row['label']])/$row['total']));
	}
	mysql_free_result($result);

	return percentageColumnChart("Pages containg Redirects", $aVarNames, $aVarValues, "008000");
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
	global $gArchive, $gLabel;

	// get errors for each label
	$result = doQuery("select label, count(distinct $gPagesTable.pageid) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and status >= 400 group by label order by $gPagesTable.startedDateTime asc;");
	$aVarNames = array();
	$hNum = array();
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, $row['label']);
		$hNum[$row['label']] = $row['num'];
	}
	mysql_free_result($result);

	// get totals for each label
	$result = doQuery("select label, count(*) as total from $gPagesTable where archive='$gArchive' group by label order by startedDateTime asc;");
	$aVarValues = array();
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarValues, round((100*$hNum[$row['label']])/$row['total']));
	}
	mysql_free_result($result);

	return percentageColumnChart("Pages with Request Errors (4xx, 5xx)", $aVarNames, $aVarValues, "B09542");
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

	return horizontalBarChart("Response Size", $aVarNames, $aVarValues, "3B356A", 0, max(array($gif, $jpg, $png, $html, $js, $css, $flash))+10, 
							  "average response size (kB)");
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
	global $gArchive, $gLabel;

	$sHtml = "<div class=itagline>pages using Flash:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqFlash > 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function popularScripts() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$total = doSimpleQuery("select count(*) from $gPagesTable where archive='$gArchive' and label='$gLabel';");
	$result = doQuery("select $gRequestsTable.url, count(distinct $gPagesTable.pageid) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and archive='$gArchive' and label='$gLabel' and resp_content_type like '%script%' group by $gRequestsTable.url order by num desc limit 5;");

	$aVarNames = array();
	$aVarValues = array();
	while ($row = mysql_fetch_assoc($result)) {
		$url = $row['url'];
		$num = $row['num'];
		array_push($aVarNames, $url);
		array_push($aVarValues, round(100*$num/$total));
	}
	mysql_free_result($result);

	return horizontalBarChart("Most Popular Scripts", $aVarNames, $aVarValues, "1D7D61", 0, 100, "sites using the script", true);
}




function jsLibraries() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

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
	$hCond["Chrome Frame"] = "$gRequestsTable.url like '%chrome-frame%'";
	$hCond["Google Libraries API"] = "$gRequestsTable.url like '%googleapis.com%'";

	$aVarNames = array();
	$aVarValues = array();
	$total = doSimpleQuery("select count(*) from $gPagesTable where archive='$gArchive' and label='$gLabel';");
	foreach (array_keys($hCond) as $key) {
		$cond = $hCond[$key];
		array_push($aVarNames, $key);
		array_push($aVarValues, round( 100*doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable where archive='$gArchive' and label='$gLabel' and $gRequestsTable.pageid=$gPagesTable.pageid and resp_content_type like '%script%' and $cond;") / $total ));
	}

	return horizontalBarChart("Popular JavaScript Libraries", $aVarNames, $aVarValues, "3399CC", 0, 100, "sites using the JS library", true);
}


function percentGoogleLibrariesAPI() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$sHtml = "<div class=itagline>pages using Google Libraries API:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable where $archivecond and $gRequestsTable.pageid=$gPagesTable.pageid and $gRequestsTable.url like '%googleapis.com%';");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentNoJS() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$sHtml = "<div class=itagline>pages with no scripts:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqJS = 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentNoCSS() {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$sHtml = "<div class=itagline>pages with no stylesheets:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqCSS = 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
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

	return horizontalBarChart("Pages with the Most JavaScript", $aVarNames, $aVarValues, "B4B418", 0, $maxValue+100, "size of all scripts (kB)");
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

	return horizontalBarChart("Pages with the Most CSS", $aVarNames, $aVarValues, "CF557B", 0, $maxValue+100, "size of all stylesheets (kB)");
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
		"&chl=" .
		urlencode(implode("|", $aNames)) .
		"&chma=|5&chtt=" . urlencode($title) . "'>";
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
		urlencode(implode("|", $aNames)) .
		"&chxr=0,0,1&chxs=1,676767,11.5,0,lt,67676700&chxtc=1,5&chxt=y,x&chbh=60,30,20&chs=500x225&cht=bvg&chco=$color&chds=0,1&chd=t:" .
		implode(",", $aValues) .
		"&chtt=" . urlencode($title) . "'>";
}


function horizontalBarChart($title, $aNames, $aValues, $color="80C65A", $min, $max, $xtitle = "", $bPercentage = false) {
	return "<img class=chart src='http://chart.apis.google.com/chart?" .
		( $bPercentage ? "chxp=0,20,40,60,80,100&chxl=0:|20%|40%|60%|80%|100%|1:|" : "chxl=1:|" ) .
		urlencode(implode("|", array_reverse($aNames))) .
		( $xtitle ? "&chdlp=b&chdl=$xtitle" : "" ) .
		"&chxtc=0,6&chxs=0,676767,11.5,0,l|1,676767,11.5,1,lt,67676700&chxr=1,0,160|0,$min,$max&chxt=x,y&chbh=22&chs=640x" .
		( count($aValues) > 7 ? 400 : ( count($aValues) > 5 ? 260 : 220 ) ) . "&cht=bhg&chco=$color&chds=$min,$max&chd=t:" .
		implode(",", $aValues) .
		"&chma=|0,5&chtt=" . urlencode($title) . "'>";
}



$gCacheFile = "interesting.js.cache";
$snippets = "";
if ( file_exists($gCacheFile) ) {
	$snippets = file_get_contents($gCacheFile);
}

if ( ! $snippets ) {
	$aSnippetFunctions = array(
							   "jsLibraries",
							   "mostJS",
							   "mostCSS",
							   //"mostFlash",
							   //"percentFlash",
							   "bytesContentType",
							   "popularImageFormats",
							   "responseSizes",
							   "popularScripts",
							   //"percentGoogleLibrariesAPI",
							   //"requestErrors",
							   //"percentNoJS",
							   //"percentNoCSS",
							   //"redirects"
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
	file_put_contents("./interesting.js.cache", $snippets);
}
?>
// HTML strings for each snippet
var gaSnippets = new Array();
<?php echo $snippets ?>


// The DOM element that is created from each snippet.
var gaSnippetElems = new Array();
var curSnippet;

function showSnippet(parentId, bPrev) {
	var parent = document.getElementById(parentId);
	if ( ! parent ) {
		return;
	}

	insertNav(parentId);

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
		newSnippet.innerHTML = gaSnippets[iSnippet];
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
	if ( document.getElementById('interestingnav') ) {
		return;
	}

	var elem = document.getElementById(parentId);
	var nav = document.createElement('div');
	nav.id = "interestingnav";
	nav.innerHTML = 
		"<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\", 1)'><img src='images/tri-lft-t-14x28.gif' width=14 height=28 border=0 style='vertical-align: middle;'></a>" +
		"<a href='interesting.php' style='margin: 0 8px; font-size: 1.4em; vertical-align: top;'>interesting stats</a>" +
		"<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\")'><img src='images/tri-rt-t-14x28.gif' width=14 height=28 border=0 style='vertical-align: middle;'></a>";
	elem.parentNode.insertBefore(nav, elem);
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
