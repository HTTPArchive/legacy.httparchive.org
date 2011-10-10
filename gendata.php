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

/*
?location - Dulles, UK, etc
?most404s
?servers - server1|per1,server2|per2,
?topscripts - script1,per1|script2,per2 - a full URL and percent of sites that use it

$gRev = '$Rev$';

$ghVersions = array(
					534 => array('CVSNO1', 'CVSNO2'),
					535 => array('CVSNO3', 'CVSNO2')
					);
*/

$gArchive = "All";
$ghSliceCondIntersection = array(); // intersection per device
$ghTrendStats = array(); // trend stats per device
$gaFields = array(
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


fillAll();

function fillAll() {
	global $gArchive;

	$hExist = getData();

	// gen data that DOESN'T exist
	$aLabels = archiveLabels($gArchive, false);
	$aLabels = array_reverse($aLabels);
	$aSlices = sliceNames();
	$aDevices = deviceNames();
	foreach ($aLabels as $label) {
		foreach ($aDevices as $device) {
			foreach ($aSlices as $slice) {
				$key = "$label|$slice|$device";
				if ( ! array_key_exists($key, $hExist) ) {
					fillOne($label, $slice, $device);
					return;
				}
			}
					return;
		}
	}
}


function fillOne($label, $slice, $device) {
	global $gaFields, $gDataTable;

	$key = "$label|$slice|$device";
	echo "filling one for $key...\n";

	setTables($device);
	$aTuples = array();
	foreach ($gaFields as $field) {
		$val = getStat($field, $label, $slice, $device);
		$aTuples[] = "$field=$val";
	}

	$cmd = "insert into $gDataTable set label='$label', slice='$slice', device='$device', " . implode(', ', $aTuples)  . ";";
	doSimpleCommand($cmd);
}


function setTables($device) {
	global $gPagesTable, $gPagesTableDesktop, $gPagesTableMobile, $gRequestsTable, $gRequestsTableDesktop, $gRequestsTableMobile;

	if ( "IE" === $device ) {
		$gPagesTable = $gPagesTableDesktop;
		$gRequestsTable = $gRequestsTableDesktop;
	}
	else if ( "iphone" === $device ) {
		$gPagesTable = $gPagesTableMobile;
		$gRequestsTable = $gRequestsTableMobile;
	}
	else { 
		echo "ERROR: unrecognized device '$device'.\n";
		exit();
	}
}


// return a where condition to select the appropriate URL slice
function sliceCond($slice, $device, $url = "") {
	global $gaTop100, $gaTop1000;

	$sliceCond = "";
	if ( "intersection" === $slice ) {
		$sliceCond = sliceCondIntersection($device);
	}
	else if ( "Top100" === $slice ) {
		$sliceCond = " and url in ('" . implode("','", $gaTop100) . "')";
	}
	else if ( "Top1000" === $slice ) {
		$sliceCond = " and url in ('" . implode("','", $gaTop1000) . "')";
	}
	else if ( "url" === $slice && isset($url) ) {
		$sliceCond = " and url = '$url'";
	}

	return $sliceCond;
}


function sliceCondIntersection($device) {
	global $gPagesTable, $gDateRange, $ghSliceCondIntersection;

	if ( ! array_key_exists($device, $ghSliceCondIntersection) ) {
		// Find the set of URLs that are constant across all labels;
		$numLabels = doSimpleQuery("select count(distinct(label)) from $gPagesTable where $gDateRange;");
		$query = "select url, count(label) as num from $gPagesTable where $gDateRange group by url having num = $numLabels;";
		$result = doQuery($query);
		$aUrls = array();
		while ( $row = mysql_fetch_assoc($result) ) {
			$aUrls[] = $row['url'];
		}
		mysql_free_result($result);
		$ghSliceCondIntersection[$device] = " and url in ('" . implode("','", $aUrls) . "')";
	}

	return $ghSliceCondIntersection[$device];
}


// okay...
// The TrendStats hash is great - it has SOME stats for EVERY label!
// SO... we want to create it once and use it many times.
// BUT... the stats depend on the slice & device.
// SO... we bury each huge hash inside a bigger hash where the key is "$slice|$device".
function getStat($statfield, $label, $slice, $device) {
	global $gPagesTable, $gDateRange, $gArchive, $gaFields, $ghTrendStats;

	$key = "$slice|$device";
	if ( ! array_key_exists($key, $ghTrendStats) ) {
		// Build the query to pull the stats for ALL fields for ALL labels, for example:
		//   select label, count(*) as numurls, ROUND(AVG(PageSpeed)/1) as PageSpeed, ROUND(AVG(reqTotal)/1) as reqTotal, ROUND(AVG(reqHtml)/1) as reqHtml, 
		//     ROUND(AVG(reqJS)/1) as reqJS, ROUND(AVG(reqCSS)/1) as reqCSS, ROUND(AVG(reqImg)/1) as reqImg, ROUND(AVG(bytesTotal)/1024) as bytesTotal, 
		//     ROUND(AVG(bytesHtml)/1024) as bytesHtml, ROUND(AVG(bytesJS)/1024) as bytesJS, ROUND(AVG(bytesCSS)/1024) as bytesCSS, 
		//     ROUND(AVG(bytesImg)/1024) as bytesImg, ROUND(AVG(numDomains)/1) as numDomains from pagesdev where archive = 'All' group by label;

		$sliceCond = sliceCond($slice, $device);
		$query = "select label, count(*) as numurls";
		foreach ($gaFields as $field) {
			$query .= ( false === strpos($field, "bytes")
						? ", TRUNCATE(AVG($field), 1) as $field"   // truncate requests to 1 decimal place
						: ", ROUND(AVG($field)) as $field" );      // round bytes to nearest integer
		}
		$query .= " from $gPagesTable where archive = '$gArchive'$sliceCond and $gDateRange group by label;";
		$result = doQuery($query);

		// Separate the stats by label.
		$hTrendStats = array();
		while ( $row = mysql_fetch_assoc($result) ) {
			$hTrendStats[$row['label']] = $row;
		}
		$ghTrendStats["$slice|$device"] = $hTrendStats;
		mysql_free_result($result);
	}

	$hTrendStats = $ghTrendStats[$key];
	$runStats = $hTrendStats[$label];
	if ( array_key_exists($statfield, $runStats) ) {
		return $runStats[$statfield];
	}
	else {
		echo "ERROR: field '$statfield' not found in trend stats for slice = $slice, device = $device.\n";
	}
}








// Find which columns to recompute based on the version # when last computed.
function flushFields($thisVer) {
	global $ghVersions;

	$aKeys = array_keys($ghVersions);
	sort($aKeys, SORT_NUMERIC);
	$aKeys = array_reverse($aKeys);
	$delFields = array();
	foreach ( $aKeys as $key ) {
		if ( $thisVer >= $key ) {
			// quick bail - sort versions in descending order and bail once we reach thisVer
			break;
		}

		$delFields = array_merge($delFields, $ghVersions[$key]);
	}

	$delFields = array_unique($delFields);
	sort($delFields);

	return $delFields;
}


function getCurVersion() {
	global $gRev;

	if ( ereg('Rev: ([0-9]*) ', $gRev, $regs) ) {
		return $regs[1];
	}

	return "error";
}
?>
