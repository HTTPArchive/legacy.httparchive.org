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

// Normally charts have an href to the page they're currently in (interesting.php or viewsite.php).
// But if we're on index.php we need to point somewhere else.
$gPhpFile = ( "/index.php" == $_SERVER['PHP_SELF'] ? "interesting.php" : "" );

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

	if ( ! count($aVarValues) ) {
		return;
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
	if ( ! $total ) {
		return;
	}
	$gif = round(100*$hStats['reqGif'] / $total);
	$jpg = round(100*$hStats['reqJpg'] / $total);
	$png = round(100*$hStats['reqPng'] / $total);
	$other = 100 - ($gif+$jpg+$png);

	$aVarNames = array("GIF $gif%", "JPEG $jpg%", "PNG $png%", "Other $other%");
	$aVarValues = array($gif, $jpg, $png, $other);

	return pieChart("Image Requests by Format", "imageformats", $aVarNames, $aVarValues, "E94E19");
}


function maxage($hStats) {
	$aNames = array("t = 0", "0 < t <= 1", "1 < t <= 30", "30 < t <= 365", "t > 365");
	$aValues = array($hStats['maxage0'],
					 $hStats['maxage1'],
					 $hStats['maxage30'],
					 $hStats['maxage365'],
					 $hStats['maxageMore']
					 );

	return percentageColumnChart("Cache Lifetime (days)", "caching", $aNames, $aValues, "184852");
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
	global $gLabel, $gSlice, $gPagesTable;
	$sliceCond = sliceCond($gLabel, $gSlice, curDevice()); //CVSNO
	$numurls = $hStats['numurls'];
	$query = "select numRedirects, round(100*count(*)/$numurls) as percent from $gPagesTable where $sliceCond group by numRedirects having percent > 1 order by numRedirects asc;";
	$result = doQuery($query);
	$aNames = array();
	$aValues = array();
	while ($row = mysql_fetch_array($result)) {
		list($numRedirects, $percent) = $row;
		array_push($aNames, $numRedirects);
		array_push($aValues, $percent);
	}
	mysql_free_result($result);

	return percentageColumnChart("Redirects per Page", "redirects", $aNames, $aValues, "000000");
}


// $var1 is "onLoad" or "renderStart"
function correlationChart($hStats, $var1) {
	global $ghColumnTitles;

	$aNames = array();
	$aValues = array();
	for ( $i = 1; $i <= 5; $i++ ) {
		$field = $hStats["{$var1}ccf$i"];
		$aNames[] = ( array_key_exists($field, $ghColumnTitles) ? $ghColumnTitles[$field] : $field );
		$aValues[] = $hStats["{$var1}ccv$i"];
	}

	$title = "Highest Correlation to " . ( "onLoad" == $var1 ? "Load" : "Render" ) . " Time";
	$color = ( "onLoad" == $var1 ? "80C65A" : "7777CC" );

	return correlationColumnChart($title, $var1, $aNames, $aValues, $color);
}






function pieChart($title, $id, $aNames, $aValues, $color="007099", $legend = "") {
	global $gPhpFile;

	return "<a href='$gPhpFile#$id'><img width=400 height=225 id=$id class=chart src='http://chart.apis.google.com/chart?chs=400x225&cht=p&chco=$color&chd=t:" .
		implode(",", $aValues) .
		chdsMinmax($aValues, true) .
		( $legend ? "&chdlp=b&chdl=$legend" : "" ) .
		"&chl=" .
		urlencode(implode("|", $aNames)) .
		"&chma=|5&chtt=" . urlencode($title) . "' style='vertical-align: top;'></a><a href='about.php#$id' class=info title='info'>i</a>";
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
	global $gPhpFile;

	$n = count($aNames);
	$colw = ( $n < 6 ? 60 : round(315/$n) );
	return "<a href='$gPhpFile#$id'><img width=500 height=225 id=$id class=chart src='http://chart.apis.google.com/chart?chxl=0:|20%25|40%25|60%25|80%25|100%25|1:|" .
		urlencode(implode("|", $aNames)) .
		"&chm=N**%,676767,0,,12,,::4&chxp=0,20,40,60,80,100&chxs=0,$color,11.5,0,lt,$color|1,676767,11.5,0,lt,67676700&chxtc=0,4|1,4&chxt=y,x&chbh=$colw,30,20&chs=500x225&cht=bvg&chco=$color&chd=t:" .
		implode(",", $aValues) .
		"&chtt=" . urlencode($title) . "' style='vertical-align: top;'></a><a href='about.php#$id' class=info title='info'>i</a>";
}


function correlationColumnChart($title, $id, $aNames, $aValues, $color="80C65A") {
	global $gPhpFile;

	return "<a href='$gPhpFile#$id'><img width=500 height=225 id=$id class=chart src='http://chart.apis.google.com/chart?chxl=1:|" .
		str_replace("Requests", "Reqs", str_replace("Transfer", "Xfer", urlencode(implode("|", $aNames)))) .
		"&chxr=0,0,1&chxs=1,676767,11.5,0,lt,67676700&chxtc=1,5&chxt=y,x&chbh=60,30,30&chs=500x225&cht=bvg&chco=$color&chds=0,1&chd=t:" .
		implode(",", $aValues) .
		"&chm=N,676767,0,,12,,::4&chtt=" . urlencode($title) . "' style='vertical-align: top;'></a><a href='about.php#$id' class=info title='info'>i</a>";
}


function horizontalBarChart($title, $id, $aNames, $aValues, $color="80C65A", $min, $max, $xtitle = "", $bPercentage = false, $markSuffix = "") {
	global $gPhpFile;

	$height = ( count($aValues) > 7 ? 370 : ( count($aValues) > 5 ? 260 : 220 ) );

	return "<a href='$gPhpFile#$id'><img width=640 height=$height id=$id class=chart src='http://chart.apis.google.com/chart?" .
		( $bPercentage ? "chxp=0,20,40,60,80,100&chxl=0:|20%|40%|60%|80%|100%|1:|" : "chxl=1:|" ) .
		urlencode(implode("|", array_reverse($aNames))) .
		( $xtitle ? "&chdlp=b&chdl=$xtitle" : "" ) .
		"&chxtc=0,6&chxs=0,676767,11.5,0,l|1,676767,11.5,1,lt,67676700&chxr=1,0,160|0,$min,$max&chxt=x,y&chbh=22&chs=640x$height" .
		"&cht=bhg&chco=$color&chds=$min,$max&chd=t:" .
		implode(",", $aValues) .
		"&chm=N**$markSuffix,676767,0,,12,,:4:&chma=|0,5&chtt=" . urlencode($title) . "' style='vertical-align: top;'></a>"; // lame - no "info" link on this chart because it's too wide <a href='about.php#$field' class=info title='info'>i</a>
}


////////////////////////////////////////////////////////////////////////////////
//
// TRENDS
// 
////////////////////////////////////////////////////////////////////////////////
function format2LineChart($field, $field2, $hTrends, $aRunNames, $labels, $sUnits2="", $bSame = false, $footnote = "", $sUnits1="") {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$color2 = fieldColor($field2);
	$suffix2 = fieldUnits($field2);

	$fieldVals = fieldValues($field, $hTrends, $aRunNames, $min, $max, false);
	$max = intval(intval($max)*1.5);  // this is a hack specific to the bytes & requests charts
	$fieldVals2 = fieldValues($field2, $hTrends, $aRunNames, $min2, $max2, false);
	if ( $bSame ) {
		// make both scales the same
		$max = $max2 = max($max, $max2);
		$min = $min2 = min($min, $min2);
	}
	$step = ( $max > 10000 ? 2000 : ( $max > 1500 ? 500 : ( $max > 200 ? 100 : ( $max > 100 ? 20 : 10 ) ) ) );
	$step2 = ( $max2 > 10000 ? 2000 : ( $max2 > 1500 ? 500 : ( $max2 > 200 ? 100 : ( $max2 > 100 ? 20 : 10 ) ) ) );
	$skip = getSkip(count($aRunNames));
	$url = "http://chart.apis.google.com/chart" .
		"?chd=t:-1|$fieldVals|-1|$fieldVals2" .
		"&chxl=0:|$labels" .
		"&chxt=x,y,r" .
		"&chs=600x300" .
		"&cht=lxy" .
		"&chco=$color,$color2" .
		"&chm=N" . ( $suffix ? "**+$suffix" : "" ) . ",$color,0,$skip,12,,h::8" . "|N" . ( $suffix2 ? "**$suffix2" : "" ) . ",$color2,1,$skip,12,,h::8" .
		"&chds=9,99,$min,$max,9,99,$min2,$max2" .
		"&chts=$color2,24" .
		"&chtt=" . urlencode(fieldTitle($field2)) . "+%26+" . urlencode(fieldTitle($field)) . 
		"&chma=5,5,5,25" .
		"&chls=1,6,3|1" .
		"&chxr=1,$min2,$max2,$step2|2,$min,$max,$step" .
		"&chxs=1,$color2,11.5,-0.5,lt,$color2,$color2|2,$color,11.5,-0.5,lt,$color,$color" .
		"&chxtc=0,4|1,4" .
		"&chxp=0&chdl=" . urlencode(fieldTitle($field)) . ( $sUnits1 ? "+$sUnits1" : "" ) . "|" . urlencode(fieldTitle($field2)) . ( $sUnits2 ? "+$sUnits2" : "" ) . "&chdlp=bv|r" .
		"";

	return "<div id='$field2&$field' style='margin: 40px 0 60px 0;'><a class=image-link href='#$field2&$field'><img src=$url width=600 height=300 style='vertical-align:top;'></a><a href='about.php#$field2' class=info title='info'>i</a>" .
		( $footnote ? "<div>$footnote<div>" : "" ) . "</div>\n";
}


function formatChart($field, $hTrends, $aRunNames, $labels, $bJson=false) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$skip = getSkip(count($aRunNames));
	$fieldVals = fieldValues($field, $hTrends, $aRunNames, $min, $max);

	if ( strpos("x|perFlash|perFonts|PageSpeed|perGlibs|maxage0|perErrors|perRedirects|perHttps|perCompressed|perCdn|", "|$field|") ) {
		$max = 100;
	}

	if ( $bJson ) {
		$hSeries = array();
		$hSeries["name"] = fieldTitle($field);
		$hSeries["labels"] = explode("|", urldecode($labels));
		$hSeries["data"] = explode(",", $fieldVals);   // wasteful - we implode then explode
		$hSeries["suffix"] = $suffix;
		$hSeries["minY"] = $min;
		$hSeries["maxY"] = $max;
		$hSeries["color"] = "#$color";
		return $hSeries;
	}
	else {
		$url = "http://chart.apis.google.com/chart" .
			"?chd=t:-1|$fieldVals" . 
			"&chxl=0:|$labels&chxt=x&chs=600x300&cht=lxy&chco=$color" .
			"&chxs=0,676767,11.5,0,lt,676767&chxtc=0,8&chm=N" . ( $suffix ? "**+$suffix" : "" ) .
			",$color,0,$skip,12,,h::8&chds=0,100,$min,$max&chts=$color,24&chtt=" . urlencode(fieldTitle($field)) . "&chls=2&chma=5,5,5,25";
		return "<div id='$field' style='margin: 40px 0 60px 0;'><a class=image-link href='#$field'><img src=$url width=600 height=300 style='vertical-align: top;'></a><a href='about.php#$field' class=info title='info'>i</a></div>\n";
	}
}


function getSkip($num, $bNum = false) {
	$skip = ( $num < 22 ? 1 : ( $num < 32 ? 2 : 3 ) );

	if ( $bNum ) {
		return $skip;
	}
	else {
		// always show the LAST value
		return ( 0 === ($num % 2) ? "1::$skip" : "::$skip" );
	}
}


function getLabels($aLabels) {
	$skip = abs(getSkip(count($aLabels), true));
	$len = count($aLabels);
	if ( ! $len ) {
		return;
	}
	$aNewLabels = array_fill(0, $len, " ");  // have to create all array elements to set in reverse order? php weirdness?
	$iLabel = 0;
	for ( $i = $len-1; $i >= 0; $i-- ) {
		$aNewLabels[$i] = ( 0 === ($iLabel % $skip) ? $aLabels[$i] : " " );
		$iLabel++;
	}

	return urlencode(implode("|", $aNewLabels));
}


function fieldValues($field, $hTrends, $aRunNames, &$min, &$max, $bZero = true) {
	$aValues = array();
	foreach($aRunNames as $run) {
		$aValues[] = ( array_key_exists($run, $hTrends) ? $hTrends[$run][$field] : "_" );
	}

	if ( "maxageNull" === $field || "maxage0" === $field ) {
		// take the inverse
		$len = count($aValues);
		for ( $i = 0; $i < $len; $i++ ) {
			$aValues[$i] = 100 - $aValues[$i];
		}
	}

	findScale($aValues, $min, $max, $bZero);

	return implode(",", $aValues);
}


function findScale($aValues, &$min, &$max, $bZero = true) {
	if ( ! count($aValues) ) {
		return;
	}
	$minValue = min($aValues);
	$maxValue = max($aValues);

	if ( "_" === $minValue || "_" === $maxValue ) {
		$minValue = $maxValue = null;
		for ( $i = 0; $i < count($aValues); $i++ ) {
			$val = $aValues[$i];
			if ( "_" === $val ) {
				continue;
			}
			$minValue = ( isset($minValue) && $minValue < $val ? $minValue : $val );
			$maxValue = ( isset($maxValue) && $maxValue > $val ? $maxValue : $val );
		}
	}

	// Power of 10 less than the min - eg 4719 ==> 3000
	$min = 0;
	if ( ! $bZero && 20 < $minValue ) {
		$base = pow(10, floor(log10($minValue)));
		$min = $base * ( floor($minValue/$base) > 1 ? floor($minValue/$base) - 1 : 1 );
	}

	// Multiple of power of 10 less than max value - eg 4719 ==> 5000
	$max = 10;
	if ( $maxValue > 10 ) {
		$base = pow(10, floor(log10($maxValue)));
		$max = $base * ceil($maxValue/$base);
	}
}

?>
