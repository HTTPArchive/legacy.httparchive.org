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

/*
DESCRIPTION: 
Return a JavaScript array of image URLs for charts.
*/

// We compute these below.
$gTotalPages = $gTotalRequests = $gMinPageid = $gMaxPageid = 0;
$gPageidCond = "";
$gJsonP = getParam('jsonp', '');

// Add the label to the cached filename.
$gArchive = "All";
if ( isset($argc) ) {
	// Handle commandline arguments when we're creating cached files from a script.
	$gLabel = $argv[1];
	$gSlice = $argv[2];
}
else if ( !isset($gLabel) && !isset($gSlice) ) {
	// Otherwise, get the label from the querystring.
	$gLabel = getParam('l', latestLabel($gArchive));
	$gSlice = getParam('s', 'All');
}

// Add the revision # to the cached filename.
// This relies on setting the SVN property:
//    svn propset svn:keywords "Rev" interesting-images.js
$gRev = '$Rev: 617 $';
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
	global $gPageidCond, $gPagesTable, $ghColumnTitles;

	// TODO - make this more flexible
	$aVars = array("PageSpeed", "reqTotal", "reqHtml", "reqJS", "reqCSS", "reqImg", "reqFlash", "reqJson", "reqOther", "bytesTotal", "bytesHtml", "bytesJS", "bytesCSS", "bytesImg", "bytesFlash", "bytesJson", "bytesOther", "numDomains");
	$hCC = array();
	foreach ($aVars as $var2) {
		// from http://www.freeopenbook.com/mysqlcookbook/mysqlckbk-chp-13-sect-6.html
		$cmd = "SELECT @n := COUNT($var1) AS n, @sumX := SUM($var2) AS 'sumX', @sumXX := SUM($var2*$var2) 'sumXX', @sumY := SUM($var1) AS 'sumY', @sumYY := SUM($var1*$var1) 'sumYY', @sumXY := SUM($var2*$var1) AS 'sumXY' FROM $gPagesTable where $gPageidCond and $var2 is not null and $var2 > 0;";
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

	return correlationColumnChart($title, $var1, $aVarNames, $aVarValues, $color);
}


function redirects() {
	global $gPageidCond, $gRequestsTable, $gTotalPages;

	$num = doSimpleQuery("select count(distinct pageid) as num from $gRequestsTable where $gPageidCond and status >= 300 and status < 400 and status != 304;");
	$yes = round(100*$num/$gTotalPages);
	$no = 100-$yes;
	$aVarNames = array("No Redirects $no%", "Redirects $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages with Redirects (3xx)", "redirects", $aVarNames, $aVarValues, "008000");
}


function requestErrors() {
	global $gPageidCond, $gRequestsTable, $gTotalPages;

	$num = doSimpleQuery("select count(distinct pageid) as num from $gRequestsTable where $gPageidCond and status >= 400 and status < 600;");
	$yes = round(100*$num/$gTotalPages);
	$no = 100-$yes;
	$aVarNames = array("No Errors $no%", "Errors $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages with Errors (4xx, 5xx)", "errors", $aVarNames, $aVarValues, "B09542");
}


function most404s() {
	global $gPageidCond, $gRequestsTable, $gPagesTable, $gTotalPages, $gTotalRequests;

	// Need to scope the pageid variable to a specific table.
	$tmpPageidCond = str_replace("pageid", "rt.pageid", $gPageidCond);

	$result = doQuery("select pt.url as url, count(rt.requestid) as cnt from $gRequestsTable rt join $gPagesTable pt on pt.pageid = rt.pageid where $tmpPageidCond and rt.status = 404 group by rt.pageid order by cnt desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, shortenUrl($row['url']));
		array_push($aVarValues, round($row['cnt']));
		if ( ! $maxValue ) {
			$maxValue = round($row['cnt']);
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, doSimpleQuery("select TRUNCATE(count(requestid)/$gTotalPages, 1) from $gRequestsTable rt where $tmpPageidCond and status = 404;"));

	return horizontalBarChart("Pages with the Most 404s", "most404", $aVarNames, $aVarValues, "B4B418", 0, $maxValue+100, "total 404s", false, "");
}


function responseSizes() {
	global $gPageidCond, $gRequestsTable;

	$gif = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and resp_content_type like '%image/gif%';") );
	$jpg = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');") );
	$png = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and resp_content_type like '%image/png%';") );
	$js = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and resp_content_type like '%script%';") );
	$css = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and resp_content_type like '%css%';") );
	$flash = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and resp_content_type like '%flash%';") );
	$html = formatSize( doSimpleQuery("select avg(respSize) from $gRequestsTable where $gPageidCond and resp_content_type like '%html%';") );

	$aVarNames = array("GIF", "JPEG", "PNG", "HTML", "JS", "CSS", "Flash");
	$aVarValues = array($gif, $jpg, $png, $html, $js, $css, $flash);

	return horizontalBarChart("Avg Individual Resource Response Size", "responsesizes", $aVarNames, $aVarValues, "3B356A", 0, max(array($gif, $jpg, $png, $html, $js, $css, $flash))+10, 
							  "average response size (kB)", false, "+kB");
}


function popularImageFormats() {
	global $gPageidCond, $gRequestsTable;

	$total = doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond and resp_content_type like '%image%';");
	$gif = round( 100*doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond and resp_content_type like '%image/gif%';") / $total);
	$jpg = round( 100*doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');") / $total);
	$png = round( 100*doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond and resp_content_type like '%image/png%';") / $total);

	$aVarNames = array("GIF $gif%", "JPEG $jpg%", "PNG $png%");
	$aVarValues = array($gif, $jpg, $png);

	return pieChart("Image Formats", "imageformats", $aVarNames, $aVarValues, "E94E19");
}


function maxage() {
	global $gPageidCond, $gRequestsTable, $gTotalRequests;

	// faster to do one query?
	// $zeroOrNeg = doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond and (resp_cache_control like '%max-age=0%' or resp_cache_control like '%max-age=-%');");

	$query = "select ceil( convert( substring( resp_cache_control, (length(resp_cache_control) + 2 - locate('=ega-xam', reverse(resp_cache_control))) ), SIGNED ) / 86400) as maxagedays, count(*) as num from $gRequestsTable where $gPageidCond and resp_cache_control like '%max-age=%' group by maxagedays order by maxagedays asc;";

	$result = doQuery($query);
	$zeroOrNeg = $day = $month = $year = $yearplus = 0;
	while ($row = mysql_fetch_assoc($result)) {
		$maxagedays = $row['maxagedays'];
		$num = $row['num'];

		if ( $maxagedays < 1 ) {
			$zeroOrNeg += $num;
		}
		else if ( 1 == $maxagedays ) {
			$day = $num;
		}
		else if ( 1 < $maxagedays && $maxagedays <= 30 ) {
			$month += $num;
		}
		else if ( 30 < $maxagedays && $maxagedays <= 365 ) {
			$year += $num;
		}
		else if ( 365 < $maxagedays ) {
			$yearplus += $num;
		}
	}
	mysql_free_result($result);

	$aNames = array("None", "t <= 0", "0 < t <= 1", "1 < t <= 30", "30 < t <= 365", "365 < t");
	$aValues = array(round(100 * ($gTotalRequests - ($zeroOrNeg + $day + $month + $year + $yearplus))/$gTotalRequests), 
					 round(100 * $zeroOrNeg / $gTotalRequests), 
					 round(100 * $day / $gTotalRequests), 
					 round(100 * $month / $gTotalRequests), 
					 round(100 * $year / $gTotalRequests), 
					 round(100 * $yearplus / $gTotalRequests) );

	return percentageColumnChart("Cache-Control: max-age (days)", "max-age", $aNames, $aValues, "184852");
}


function popularServers() {
	global $gPageidCond, $gRequestsTable, $gTotalPages;

	$result = doQuery("select count(*) as num, substring_index(substring_index(substring_index(lower(ifnull(resp_server, '')), ' ', 1), '/', 1), '(', 1) as server_name from $gRequestsTable where $gPageidCond and firstHtml = 1 group by server_name order by num desc limit 9;");

	$otherCount = $gTotalPages;
	$aVarNames = array();
	$aVarValues = array();
	while ($row = mysql_fetch_assoc($result)) {
		$serverName = $row['server_name'];
		if (!$serverName) {
			$serverName = 'unspecified';
		}
		$num = $row['num'];
		array_push($aVarNames, "$serverName " . round(100*$num/$gTotalPages) . "%");
		array_push($aVarValues, $num);
		$otherCount -= $num;
	}
	mysql_free_result($result);
	array_push($aVarNames, 'other ' . round(100*$otherCount/$gTotalPages) . "%");
	array_push($aVarValues, $otherCount);

	return pieChart("Most Common Servers", "servers", $aVarNames, $aVarValues, "E94E19");
}


function percentByProtocol() {
	global $gPageidCond, $gRequestsTable, $gTotalRequests;

	$num = doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond and url like 'https://%'");
	$https = round(100*$num/$gTotalRequests);
	$http = 100-$https;
	$aVarNames = array("HTTP $http%", "HTTPS $https%");
	$aVarValues = array($http, $https);

	return pieChart("Requests by Protocol", "protocol", $aVarNames, $aVarValues, "7777CC");
}


function bytesContentType() {
	global $gPageidCond, $gPagesTable;

	$row = doRowQuery("select avg(bytesTotal) as total, avg(bytesHtml) as html, avg(bytesJS) as js, avg(bytesCSS) as css, avg(bytesImg) as img, avg(bytesFlash) as flash, avg(bytesJson) as json, avg(bytesOther) as other from $gPagesTable where $gPageidCond;");
	$total = $row['total'];
	$aVarValues = array( formatSize($row['html']), formatSize($row['img']), formatSize($row['js']), 
						 formatSize($row['css']), formatSize($row['flash']), formatSize($row['json']+$row['other']) );
	$aVarNames = array("HTML - " . $aVarValues[0] . " kB", "Images - " . $aVarValues[1] . " kB", "Scripts - " . $aVarValues[2] . " kB", 
					   "Stylesheets - " . $aVarValues[3] . " kB", "Flash - " . $aVarValues[4] . " kB", "Other - " . $aVarValues[5] . " kB");
	return pieChart("Average Bytes per Page by Content Type", "bytesperpage", $aVarNames, $aVarValues, "007099", "total " . formatSize($total) . " kB");
}


function percentFlash() {
	global $gPageidCond, $gPagesTable, $gTotalPages;

	$num = doSimpleQuery("select count(*) from $gPagesTable where $gPageidCond and reqFlash > 0;");
	$yes = round(100*$num/$gTotalPages);
	$no = 100-$yes;
	$aVarNames = array("No Flash $no%", "Flash $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Flash", "flash", $aVarNames, $aVarValues, "AA0033");
}


function popularScripts() {
	global $gPageidCond, $gPagesTable, $gRequestsTable, $gTotalPages;

	// Need to scope the pageid variable to a specific table.
	$tmpPageidCond = str_replace("pageid", "rt.pageid", $gPageidCond);

	$result = doQuery("select rt.url, count(distinct $gPagesTable.pageid) as num from $gPagesTable, $gRequestsTable rt where rt.pageid=$gPagesTable.pageid and $tmpPageidCond and resp_content_type like '%script%' group by rt.url order by num desc limit 5;");

	$aVarNames = array();
	$aVarValues = array();
	while ($row = mysql_fetch_assoc($result)) {
		$url = $row['url'];
		$num = $row['num'];
		if ( 1 < $num ) {
			array_push($aVarNames, $url);
			array_push($aVarValues, round(100*$num/$gTotalPages));
		}
	}
	mysql_free_result($result);

	return horizontalBarChart("Most Popular Scripts", "popularjs", $aVarNames, $aVarValues, "1D7D61", 0, 100, "sites using the script", true, "%");
}




function jsLibraries() {
	global $gPageidCond, $gPagesTable, $gRequestsTable, $gTotalPages;

	// Need to scope the pageid variable to a specific table.
	$tmpPageidCond = str_replace("pageid", "rt.pageid", $gPageidCond);

	$hCond = array();
	$hCond["jQuery"] = "rt.url like '%jquery%'";
	$hCond["YUI"] = "(rt.url like '%/yui-min.js%' or rt.url like '%/yui.js%' or rt.url like '%/yui-debug.js%' or rt.url like '%/yahoo.js%' or rt.url like '%/yahoo-min.js%' or rt.url like '%/yahoo-debug.js%' or rt.url like '%/yahoo-dom-event.js%')";
	$hCond["Dojo"] = "rt.url like '%dojo%'";
	$hCond["Google Analytics"] = "(rt.url like '%/ga.js%' or rt.url like '%/urchin.js%')";
	$hCond["Quantcast"] = "rt.url like '%quant.js%'";
	$hCond["AddThis"] = "rt.url like '%addthis.com%'";
	$hCond["Facebook"] = "(rt.url like '%facebook.com/plugins/%' or rt.url like '%facebook.com/widgets/%' or rt.url like '%facebook.com/connect/%')";
	$hCond["Google +1"] = "rt.url like '%google.com/js/plusone.js%'";
	$hCond["Twitter"] = "rt.url like '%twitter%'";
	$hCond["ShareThis"] = "rt.url like '%sharethis%'";

	$aVarNames = array();
	$aVarValues = array();
	foreach (array_keys($hCond) as $key) {
		$cond = $hCond[$key];
		array_push($aVarNames, $key);
		array_push($aVarValues, round( 100*doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable rt where $tmpPageidCond and rt.pageid=$gPagesTable.pageid and (resp_content_type like '%script%' or resp_content_type like '%html%') and $cond;") / $gTotalPages ));
	}

	return horizontalBarChart("Popular JavaScript Libraries", "popularjslib", $aVarNames, $aVarValues, "3399CC", 0, 100, "sites using the JS library", true, "%");
}


function percentGoogleLibrariesAPI() {
	global $gPageidCond, $gPagesTable, $gRequestsTable, $gTotalPages;

	// Need to scope the pageid variable to a specific table.
	$tmpPageidCond = str_replace("pageid", "rt.pageid", $gPageidCond);

	$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable rt where $tmpPageidCond and rt.pageid=$gPagesTable.pageid and rt.url like '%googleapis.com%';");
	$yes = round(100*$num/$gTotalPages);
	$no = 100-$yes;
	$aVarNames = array("no $no%", "yes $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Google Libraries API", "googlelibs", $aVarNames, $aVarValues, "7777CC");
}


function mostJS() {
	global $gPageidCond, $gPagesTable;

	$result = doQuery("select url, bytesJS from $gPagesTable where $gPageidCond order by bytesJS desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, shortenUrl($row['url']));
		array_push($aVarValues, round($row['bytesJS']/1024));
		if ( ! $maxValue ) {
			$maxValue = round($row['bytesJS']/1024);
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, round(doSimpleQuery("select avg(bytesJS) from $gPagesTable where $gPageidCond;")/1024));

	return horizontalBarChart("Pages with the Most JavaScript", "mostjs", $aVarNames, $aVarValues, "B4B418", 0, $maxValue+100, "size of all scripts (kB)", false, "+kB");
}


function mostCSS() {
	global $gPageidCond, $gPagesTable;

	$result = doQuery("select url, bytesCSS from $gPagesTable where $gPageidCond order by bytesCSS desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, shortenUrl($row['url']));
		array_push($aVarValues, round($row['bytesCSS']/1024));
		if ( ! $maxValue ) {
			$maxValue = round($row['bytesCSS']/1024);
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, round(doSimpleQuery("select avg(bytesCSS) from $gPagesTable where $gPageidCond;")/1024));

	return horizontalBarChart("Pages with the Most CSS", "mostcss", $aVarNames, $aVarValues, "CF557B", 0, $maxValue+100, "size of all stylesheets (kB)", false, "+kB");
}


function mostImages() {
	global $gPageidCond, $gPagesTable;

	$result = doQuery("select url, reqImg from $gPagesTable where $gPageidCond order by reqImg desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, shortenUrl($row['url']));
		array_push($aVarValues, $row['reqImg']);
		if ( ! $maxValue ) {
			$maxValue = $row['reqImg'];
		}
	}
	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, doSimpleQuery("select avg(reqImg) from $gPagesTable where $gPageidCond;"));

	return horizontalBarChart("Pages with the Most Images", "mostimages", $aVarNames, $aVarValues, "1515FF", 0, $maxValue+10);
}


function mostFlash() {
	global $gPageidCond, $gPagesTable;

	$result = doQuery("select url, reqFlash from $gPagesTable where $gPageidCond order by reqFlash desc limit 5;");
	$aVarNames = array();
	$aVarValues = array();
	$maxValue = 0;
	while ($row = mysql_fetch_assoc($result)) {
		array_push($aVarNames, shortenUrl($row['url']));
		array_push($aVarValues, $row['reqFlash']);
		if ( ! $maxValue ) {
			$maxValue = $row['reqFlash'];
		}
	}

	if ( 0 == $maxValue ) {
		return "";
	}

	mysql_free_result($result);
	array_push($aVarNames, "average");
	array_push($aVarValues, doSimpleQuery("select avg(reqFlash) from $gPagesTable where $gPageidCond;"));

	return horizontalBarChart("Pages with the Most Flash Files", "mostflash", $aVarNames, $aVarValues, "AA0033", 0, $maxValue+10);
}


function pieChart($title, $id, $aNames, $aValues, $color="007099", $legend = "") {
	return "<a href='interesting.php#$id'><img id=$id class=chart src='http://chart.apis.google.com/chart?chs=400x225&cht=p&chco=$color&chd=t:" .
		implode(",", $aValues) .
		chdsMinmax($aValues, true) .
		( $legend ? "&chdlp=b&chdl=$legend" : "" ) .
		"&chl=" .
		urlencode(implode("|", $aNames)) .
		"&chma=|5&chtt=" . urlencode($title) . "'></a>";
}


// The chd (data) param in text ("t:") format only allows values from 0-100.
// You have to use the chds param if you have values outside that range.
function chdsMinmax($aValues, $bZero = false) {
	$chds = "";
	if ( count($aValues) ) {
		$min = ( $bZero ? 0 : min($aValues) );
		$max = max($aValues);
		if ( $min < 0 || $max > 100 ) {
			$chds = "&chds=$min,$max";
		}
	}

	return $chds;
}


function percentageColumnChart($title, $id, $aNames, $aValues, $color="80C65A") {
	return "<a href='interesting.php#$id'><img id=$id class=chart src='http://chart.apis.google.com/chart?chxl=0:|20%25|40%25|60%25|80%25|100%25|1:|" .
		urlencode(implode("|", $aNames)) .
		"&chm=N**%,676767,0,,12,,::4&chxp=0,20,40,60,80,100&chxs=0,$color,11.5,0,lt,$color|1,676767,11.5,0,lt,67676700&chxtc=0,4|1,4&chxt=y,x&chbh=60,30,20&chs=500x225&cht=bvg&chco=$color&chd=t:" .
		implode(",", $aValues) .
		"&chtt=" . urlencode($title) . "'></a>";
}


function correlationColumnChart($title, $id, $aNames, $aValues, $color="80C65A") {
	return "<a href='interesting.php#$id'><img id=$id class=chart src='http://chart.apis.google.com/chart?chxl=1:|" .
		str_replace("Requests", "Reqs", str_replace("Transfer", "Xfer", urlencode(implode("|", $aNames)))) .
		"&chxr=0,0,1&chxs=1,676767,11.5,0,lt,67676700&chxtc=1,5&chxt=y,x&chbh=60,30,30&chs=500x225&cht=bvg&chco=$color&chds=0,1&chd=t:" .
		implode(",", $aValues) .
		"&chm=N,676767,0,,12,,::4&chtt=" . urlencode($title) . "'></a>";
}


function horizontalBarChart($title, $id, $aNames, $aValues, $color="80C65A", $min, $max, $xtitle = "", $bPercentage = false, $markSuffix = "") {
	return "<a href='interesting.php#$id'><img id=$id class=chart src='http://chart.apis.google.com/chart?" .
		( $bPercentage ? "chxp=0,20,40,60,80,100&chxl=0:|20%|40%|60%|80%|100%|1:|" : "chxl=1:|" ) .
		urlencode(implode("|", array_reverse($aNames))) .
		( $xtitle ? "&chdlp=b&chdl=$xtitle" : "" ) .
		"&chxtc=0,6&chxs=0,676767,11.5,0,l|1,676767,11.5,1,lt,67676700&chxr=1,0,160|0,$min,$max&chxt=x,y&chbh=22&chs=640x" .
		( count($aValues) > 7 ? 370 : ( count($aValues) > 5 ? 260 : 220 ) ) . "&cht=bhg&chco=$color&chds=$min,$max&chd=t:" .
		implode(",", $aValues) .
		"&chm=N**$markSuffix,676767,0,,12,,:4:&chma=|0,5&chtt=" . urlencode($title) . "'></a>";
}


// example: interesting-images.js.356.Mar 29 2011.cache
$gCacheFile = "./cache/interesting-images.js.$gRev.$gLabel.$gSlice.cache";
$charts = "";

if ( file_exists($gCacheFile) ) {
	$charts = file_get_contents($gCacheFile);
}

if ( ! $charts ) {
	// Saves a little time since we use the # of pages frequently.
	$row = doRowQuery("select min(pageid) as minp, max(pageid) as maxp from $gPagesTable where archive='$gArchive' and label='$gLabel';");
	$gMinPageid = $row['minp'];
	$gMaxPageid = $row['maxp'];
	$gPageidCond = "pageid >= $gMinPageid and pageid <= $gMaxPageid";

	if ( isset($gSlice) ) {
    	if ( "intersection" === $gSlice ) {
			// Find the set of URLs that are constant across all labels;
			$numLabels = doSimpleQuery("select count(distinct(label)) from $gPagesTable where $gDateRange;");
			$query = "select url, count(label) as num from $gPagesTable where $gDateRange group by url having num = $numLabels;";
			$result = doQuery($query);
			$aUrls = array();
			while ( $row = mysql_fetch_assoc($result) ) {
				$aUrls[] = $row['url'];
			}
			mysql_free_result($result);

			$query = "select pageid from $gPagesTable where pageid >= $gMinPageid and pageid <= $gMaxPageid and url in ('" . implode("','", $aUrls) . "');";
			$result = doQuery($query);
			$aPageids = array();
			while ( $row = mysql_fetch_assoc($result) ) {
				$aPageids[] = $row['pageid'];
			}
			mysql_free_result($result);

			$gPageidCond = "pageid in ('" . implode("','", $aPageids) . "')";
		}
		else if ( "Top100" === $gSlice || "Top1000" === $gSlice ) {
			$query = "select pageid from $gPagesTable where pageid >= $gMinPageid and pageid <= $gMaxPageid and url in ('" . 
				implode("','", ( "Top100" === $gSlice ? $gaTop100 : $gaTop1000 )) . "');";
			$result = doQuery($query);
			$aPageids = array();
			while ( $row = mysql_fetch_assoc($result) ) {
				$aPageids[] = $row['pageid'];
			}
			mysql_free_result($result);

			$gPageidCond = "pageid in ('" . implode("','", $aPageids) . "')";
		}
	}

	$gTotalPages = doSimpleQuery("select count(*) from $gPagesTable where $gPageidCond;");
	$gTotalRequests = doSimpleQuery("select count(*) from $gRequestsTable where $gPageidCond;");

	// The list of "interesting stats" charts.
	// We put this here so we can set the element id.
	$aSnippetFunctions = array(
							   "bytesContentType",
							   "responseSizes",

							   "jsLibraries",
							   "popularScripts",
							   "percentGoogleLibrariesAPI",

							   "mostJS",
							   "mostCSS",
							   "mostImages",
							   "mostFlash",

							   "percentFlash",
							   "popularImageFormats",

							   "maxage",
							   "popularServers",
							   //"percentByProtocol",

							   "requestErrors",
							   "most404s",
							   "redirects",

							   "onloadCorrelation",
							   "renderCorrelation"
							   );


	foreach($aSnippetFunctions as $func) {
		$chartblurb = call_user_func($func);
		if ( $chartblurb ) {
			$charts .= "$chartblurb\n";
		}
	}
	// This won't work for web site users because of permissions.
	// Run "php interesting-images.js" from the commandline to generate the cache file.
	// I'll leave this line generating errors as a reminder to create the cache file.
	file_put_contents($gCacheFile, $charts);
}

$aCharts = explode("\n", $charts);
if ( isset($gbHTML) && $gbHTML ) {
	foreach( $aCharts as $chartblurb ) {
		if ( $chartblurb ) {
			echo "<div class=ianswer>$chartblurb</div>\n";
		}
	}
}
else {
	echo "// HTML strings for each image\nvar gaSnippets = new Array();\n\n";
	foreach( $aCharts as $chartblurb ) {
		if ( $chartblurb ) {
			echo 'gaSnippets.push("' . $chartblurb . '");' . "\n";
		}
	}
}

if ( $gJsonP ) {
	echo "\n$gJsonP(gaSnippets);\n";
}
?>

