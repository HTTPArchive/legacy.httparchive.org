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



function pagesTable($label, $slice, $device) {
	$pagestable = "pages";
	if ( "iphone" === $device ) {
		$pagestable .= "mobile";
	}
	else if ( isDev() ) {
		$pagestable .= "dev";
	}

	return $pagestable;
}


function requestsTable($label, $slice, $device) {
	$requeststable = "requests";
	if ( "iphone" === $device ) {
		$requeststable .= "mobile";
	}
	else if ( isDev() ) {
		$requeststable .= "dev";
	}

	return $requeststable;
}


function statsTable($label, $slice, $device) {
	$statstable = "stats";
	if ( "iphone" === $device ) {
		// iphone & IE8 share the same stats table
	}
	else if ( isDev() ) {
		$statstable .= "dev";
	}

	return $statstable;
}


// return a where condition to select the appropriate URL slice
function sliceCond($slice, $device, $url = "") {
	global $gaTop100, $gaTop1000;

	$sliceCond = "";
	if ( "intersection" === $slice ) {
		$sliceCond = sliceCondIntersection($device);
	}
	else if ( "Top100" === $slice ) {
		$sliceCond = " and url in ('" . implode("','", $gaTop100) . "') ";
	}
	else if ( "Top1000" === $slice ) {
		$sliceCond = " and url in ('" . implode("','", $gaTop1000) . "') ";
	}
	else if ( "url" === $slice && isset($url) ) {
		$sliceCond = " and url = '$url' ";
	}

	return $sliceCond;
}




////////////////////////////////////////////////////////////////////////////////
//
// STATS
//
////////////////////////////////////////////////////////////////////////////////

$gaTrendStats = array(
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


// return a hash of values for a single stats record
function addStatsData($label, $slice, $device, $hTuples) {
	$statstable = statsTable($label, $slice, $device);
	$cmd = "insert into $statstable set label='$label', slice='$slice', device='$device', " . hashImplode(", ", "=", $hTuples) . ";";
	doSimpleCommand($cmd);

	return true;
}


// return a hash of values for a single stats record
function getStatsData($label, $slice, $device) {
	$statstable = statsTable($label, $slice, $device);
	$query = "select * from $statstable where label='$label' and slice='$slice' and device='$device';";
	$row = doRowQuery($query);

	return $row;
}


// return a hash of values for a single stats record
function removeStatsData($label, $slice, $device) {
	$statstable = statsTable($label, $slice, $device);
	$cmd = "delete from $statstable where label='$label' and slice='$slice' and device='$device';";
	doSimpleCommand($cmd);

	return true;
}


// return a hash of stats
function computeStatsData($label, $slice, $device) {
	$hStats = array();
	$sliceCond = sliceCond($slice, $device);  // this might be expensive - compute it once
	$hStats += computeTrendStats($label, $slice, $device, $sliceCond);

	return $hStats;
}


function computeTrendStats($label, $slice, $device, $sliceCond) {
	$aFields = trendStatsFields();
	$pagesTable = pagesTable($label, $slice, $device);

	$query = "select count(*) as numurls";
	foreach ($aFields as $field) {
		$query .= ( false === strpos($field, "bytes")
					? ", TRUNCATE(AVG($field), 1) as $field"   // truncate requests to 1 decimal place
					: ", ROUND(AVG($field)) as $field" );      // round bytes to nearest integer
	}
	$query .= " from $pagesTable where archive = 'All' and label='$label' $sliceCond;";
	$row = doRowQuery($query);

	return $row;
}


function trendStatsFields() {
	global $gaTrendStats;
	return $gaTrendStats;
}


function computeCorrelations($label, $slice, $device, $sliceCond) {
}

function onloadCorrelation() {
	return findCorrelation("onLoad", "load", "Highest Correlation to Load Time");
}


function renderCorrelation() {
	return findCorrelation("renderStart", "render");
}


function computeCorrelations($label, $slice, $device, $sliceCond, $var1) {
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


///////////// DATA

// return a hash where the keys are "label_slice_device", eg, "Oct 1 2011_Top1000_IE8"
function getData($label="", $slice="", $device="") {
	global $gDataTable;

	$hData = array();
	$cond = "";
	if ( $label || $slice || $device ) {
		$cond .= ( $label ? " label='$label'" : "" );
		$cond .= ( $slice ? ($cond ? " and" : "") . " slice='$slice'" : "" );
		$cond .= ( $device ? ($cond ? " and" : "") . " device='$device'" : "" );
		$cond = " where" . $cond;
	}

	$query = "select label, slice, device from $gDataTable$cond;";
	$result = doQuery($query);
	while ( $row = mysql_fetch_assoc($result) ) {
		$label = $row['label'];
		$slice = $row['slice'];
		$device = $row['device'];
		$hData["$label|$slice|$device"] = true;
	}
	mysql_free_result($result);

	return $hData;
}
?>
