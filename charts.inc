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
require_once("dbapi.inc");


// eg: average total amount of JS downloaded per page
function bytesContentTypeChart($hStats) {
	$aVarValues = array();
	$aVarNames = array();
	$kb = formatSize($hStats['bytesHtml']);
	if ( $kb ) {
		$aVarValues[] = $kb;
		$aVarNames[] = "HTML - $kb kB";
	}
	$kb = formatSize($hStats['bytesImg']);
	if ( $kb ) {
		$aVarValues[] = $kb;
		$aVarNames[] = "Images - $kb kB";
	}
	$kb = formatSize($hStats['bytesJS']);
	if ( $kb ) {
		$aVarValues[] = $kb;
		$aVarNames[] = "Scripts - $kb kB";
	}
	$kb = formatSize($hStats['bytesCSS']);
	if ( $kb ) {
		$aVarValues[] = $kb;
		$aVarNames[] = "Stylesheets - $kb kB";
	}
	$kb = formatSize($hStats['bytesFlash']);
	if ( $kb ) {
		$aVarValues[] = $kb;
		$aVarNames[] = "Flash - $kb kB";
	}
	$kb = formatSize($hStats['bytesJson'] + $hStats['bytesOther']);
	if ( $kb ) {
		$aVarValues[] = $kb;
		$aVarNames[] = "Other - $kb kB";
	}

	return pieChart("Average Bytes per Page by Content Type", "bytesperpage", $aVarNames, $aVarValues, "007099", 
					"total " . formatSize($hStats['bytesTotal']) . " kB");
}


function responseSizes($hStats) {
	$aVarValues = array();
	$aVarNames = array();
	if ( 0 != $hStats['reqGif'] ) {
		$aVarValues[] = formatSize( $hStats['bytesGif'] / $hStats['reqGif'] );
		$aVarNames[] = "GIF";
	}
	if ( 0 != $hStats['reqJpg'] ) {
		$aVarValues[] = formatSize( $hStats['bytesJpg'] / $hStats['reqJpg'] );
		$aVarNames[] = "JPEG";
	}
	if ( 0 != $hStats['reqPng'] ) {
		$aVarValues[] = formatSize( $hStats['bytesPng'] / $hStats['reqPng'] );
		$aVarNames[] = "PNG";
	}
	if ( 0 != $hStats['reqHtml'] ) {
		$aVarValues[] = formatSize( $hStats['bytesHtml'] / $hStats['reqHtml'] );
		$aVarNames[] = "HTML";
	}
	if ( 0 != $hStats['reqJS'] ) {
		$aVarValues[] = formatSize( $hStats['bytesJS'] / $hStats['reqJS'] );
		$aVarNames[] = "JS";
	}
	if ( 0 != $hStats['reqCSS'] ) {
		$aVarValues[] = formatSize( $hStats['bytesCSS'] / $hStats['reqCSS'] );
		$aVarNames[] = "CSS";
	}
	if ( 0 != $hStats['reqFlash'] ) {
		$aVarValues[] = formatSize( $hStats['bytesFlash'] / $hStats['reqFlash'] );
		$aVarNames[] = "Flash";
	}

	return horizontalBarChart("Average Individual Response Size", "responsesizes", $aVarNames, $aVarValues, "3B356A", 0, max($aVarValues)+10, 
							  "average response size (kB)", false, "+kB");
}


function percentGoogleLibrariesAPI($hStats) {
	$yes = $hStats['perGlibs'];
	$no = 100-$yes;
	$aVarNames = array("no $no%", "yes $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Google Libraries API", "googlelibs", $aVarNames, $aVarValues, "7777CC");
}


function percentFlash($hStats) {
	$yes = $hStats['perFlash'];
	$no = 100-$yes;
	$aVarNames = array("No Flash $no%", "Flash $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Flash", "flash", $aVarNames, $aVarValues, "AA0033");
}


function percentFonts($hStats) {
	$yes = $hStats['perFonts'];
	$no = 100-$yes;
	$aVarNames = array("No Fonts $no%", "Fonts $yes%");
	$aVarValues = array($no, $yes);
	return pieChart("Pages Using Custom Fonts", "fonts", $aVarNames, $aVarValues, "CF557B");
}


function popularImageFormats($hStats) {
	$total = $hStats['reqImg'];
	$gif = round(100*$hStats['reqGif'] / $total);
	$jpg = round(100*$hStats['reqJpg'] / $total);
	$png = round(100*$hStats['reqPng'] / $total);
	$other = 100 - ($gif+$jpg+$png);

	$aVarNames = array("GIF $gif%", "JPEG $jpg%", "PNG $png%", "Other $other%");
	$aVarValues = array($gif, $jpg, $png, $other);

	return pieChart("Image Requests by Format", "imageformats", $aVarNames, $aVarValues, "E94E19");
}


function maxage($hStats) {
	$aNames = array("None", "t <= 0", "0 < t <= 1", "1 < t <= 30", "30 < t <= 365", "365 < t");
	$aValues = array($hStats['maxageNull'],
					 $hStats['maxage0'],
					 $hStats['maxage1'],
					 $hStats['maxage30'],
					 $hStats['maxage365'],
					 $hStats['maxageMore']
					 );

	return percentageColumnChart("Cache-Control: max-age (days)", "max-age", $aNames, $aValues, "184852");
}


function percentByProtocol($hStats) {
	$https = $hStats['perHttps'];
	$http = 100-$https;
	$aVarNames = array("HTTP $http%", "HTTPS $https%");
	$aVarValues = array($http, $https);

	return pieChart("HTTPS Requests", "protocol", $aVarNames, $aVarValues, "B4B418");
}


function requestErrors($hStats) {
	$yes = $hStats['perErrors'];
	$no = 100-$yes;
	$aVarNames = array("No Errors $no%", "Errors $yes%");
	$aVarValues = array($no, $yes);

	return pieChart("Pages with Errors (4xx, 5xx)", "errors", $aVarNames, $aVarValues, "B09542");
}


function redirects($hStats) {
	$yes = $hStats['perRedirects'];
	$no = 100-$yes;
	$aVarNames = array("No Redirects $no%", "Redirects $yes%");
	$aVarValues = array($no, $yes);

	return pieChart("Pages with Redirects (3xx)", "redirects", $aVarNames, $aVarValues, "008000");
}


// $var1 is "onLoad" or "renderStart"
function correlationChart($hStats, $var1) {
	global $ghColumnTitles;

	$aNames = array();
	$aValues = array();
	for ( $i = 1; $i <= 5; $i++ ) {
		$aNames[] = $ghColumnTitles[$hStats["{$var1}ccf$i"]];
		$aValues[] = $hStats["{$var1}ccv$i"];
	}

	$title = "Highest Correlation to " . ( "onLoad" == $var1 ? "Load" : "Render" ) . " Time";
	$color = ( "onLoad" == $var1 ? "80C65A" : "7777CC" );

	return correlationColumnChart($title, $var1, $aNames, $aValues, $color);
}






function pieChart($title, $id, $aNames, $aValues, $color="007099", $legend = "") {
	return "<a href='interesting.php#$id'><img width=400 height=225 id=$id class=chart src='http://chart.apis.google.com/chart?chs=400x225&cht=p&chco=$color&chd=t:" .
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
	return "<a href='interesting.php#$id'><img width=500 height=225 id=$id class=chart src='http://chart.apis.google.com/chart?chxl=0:|20%25|40%25|60%25|80%25|100%25|1:|" .
		urlencode(implode("|", $aNames)) .
		"&chm=N**%,676767,0,,12,,::4&chxp=0,20,40,60,80,100&chxs=0,$color,11.5,0,lt,$color|1,676767,11.5,0,lt,67676700&chxtc=0,4|1,4&chxt=y,x&chbh=60,30,20&chs=500x225&cht=bvg&chco=$color&chd=t:" .
		implode(",", $aValues) .
		"&chtt=" . urlencode($title) . "'></a>";
}


function correlationColumnChart($title, $id, $aNames, $aValues, $color="80C65A") {
	return "<a href='interesting.php#$id'><img width=500 height=225 id=$id class=chart src='http://chart.apis.google.com/chart?chxl=1:|" .
		str_replace("Requests", "Reqs", str_replace("Transfer", "Xfer", urlencode(implode("|", $aNames)))) .
		"&chxr=0,0,1&chxs=1,676767,11.5,0,lt,67676700&chxtc=1,5&chxt=y,x&chbh=60,30,30&chs=500x225&cht=bvg&chco=$color&chds=0,1&chd=t:" .
		implode(",", $aValues) .
		"&chm=N,676767,0,,12,,::4&chtt=" . urlencode($title) . "'></a>";
}


function horizontalBarChart($title, $id, $aNames, $aValues, $color="80C65A", $min, $max, $xtitle = "", $bPercentage = false, $markSuffix = "") {
	$height = ( count($aValues) > 7 ? 370 : ( count($aValues) > 5 ? 260 : 220 ) );

	return "<a href='interesting.php#$id'><img width=640 height=$height id=$id class=chart src='http://chart.apis.google.com/chart?" .
		( $bPercentage ? "chxp=0,20,40,60,80,100&chxl=0:|20%|40%|60%|80%|100%|1:|" : "chxl=1:|" ) .
		urlencode(implode("|", array_reverse($aNames))) .
		( $xtitle ? "&chdlp=b&chdl=$xtitle" : "" ) .
		"&chxtc=0,6&chxs=0,676767,11.5,0,l|1,676767,11.5,1,lt,67676700&chxr=1,0,160|0,$min,$max&chxt=x,y&chbh=22&chs=640x$height" .
		"&cht=bhg&chco=$color&chds=$min,$max&chd=t:" .
		implode(",", $aValues) .
		"&chm=N**$markSuffix,676767,0,,12,,:4:&chma=|0,5&chtt=" . urlencode($title) . "'></a>";
}

?>