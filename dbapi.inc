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
require_once("settings.inc");

// default table names
$gPagesTable = "pages";
$gRequestsTable = "requests";
$gStatusTable = "status";
$gUrlsTable = "urls";
$gUrlsChangeTable = "urlschange";
$gStatsTable = "stats";
$gSettingsTable = "settings"; // for storing misc settings persistently

// Desktop tables
$gPagesTableDesktop = $gPagesTable;
$gRequestsTableDesktop = $gRequestsTable;
$gStatusTableDesktop = $gStatusTable;
$gUrlsTableDesktop = "urls";
$gStatsTableDesktop = $gStatsTable;
$gUrlsChangeTableDesktop = $gUrlsChangeTable;

// Mobile tables
$gPagesTableMobile = $gPagesTable . "mobile";
$gRequestsTableMobile = $gRequestsTable . "mobile";
$gUrlsTableMobile = "urls";
$gStatusTableMobile = $gStatusTable . "mobile";
$gStatsTableMobile = $gStatsTable;  // share the data table - a first step toward a single DB

// Dev tables
$gPagesTableDev = $gPagesTable . "dev";
$gRequestsTableDev = $gRequestsTable . "dev";
$gStatusTableDev = $gStatusTable . "dev";
$gStatsTableDev = $gStatsTable . "dev";
$gUrlsTableDev = $gUrlsTable . "dev";
$gUrlsChangeTableDev = $gUrlsChangeTable; // . "dev";

// 
// HERE'S WHERE WE CHANGE THE DEFAULT TABLE NAMES 
// DEPENDING ON WHETHER WE'RE DEV OR MOBILE
// 
if ( $gbDev ) {
	// Use a dev version of the database tables if "dev/" is in the path.
	$gPagesTable = $gPagesTableDev;
	$gRequestsTable = $gRequestsTableDev;
	$gStatusTable = $gStatusTableDev;
	$gStatsTable = $gStatsTableDev;
	$gUrlsTable = $gUrlsTableDev;
	$gUrlsChangeTable = $gUrlsChangeTableDev;
}
else if ( $gbMobile ) {
	// Use a mobile version of the database tables if "mobile" is in the path.
	$gPagesTable = $gPagesTableMobile;
	$gRequestsTable = $gRequestsTableMobile;
	$gStatusTable = $gStatusTableMobile;
	$gStatsTable = $gStatsTableMobile;
}



// We restrict the range of queries by adding a date range.
// Sometimes the date range is affected by querystring params.
// We also avoid old, undesired data with this.
$pDateRange = $pDateRangeDefault = null; // for efficiency
function dateRange($bDefault = false) {
	global $pDateRange, $pDateRangeDefault, $gbMobile;

	// Here's the scoop: We use $pDateRange as a nice global throughout most of our queries to limit
	// the scope of data. BUT...this is a problem when we want to, for example, present the user with 
	// a list of labels to choose from - we don't want that list of labels to be limited. 
	// So in some places we use $pDateRangeDefault to get the WHOLE range of data.
	if ( $bDefault ) {
		if ( null === $pDateRangeDefault ) {
			// Query ALL the date ranges but avoid some undesired data (old, small runs).
			$pDateRangeDefault = ( isPrivateInstance() ? "pageid >= 1" : ( $gbMobile ? "pageid >= 607" : "pageid >= 10281" ) );
		}
		return $pDateRangeDefault;
	}
	else {
		if ( null === $pDateRange ) {
			// Query ALL the date ranges but avoid some undesired data (old, small runs).
			$pDateRange = ( isPrivateInstance() ? "pageid >= 1" : ( $gbMobile ? "pageid >= 607" : "pageid >= 10281" ) );
			if ( minLabel() ) {
				$pDateRange .= " and pageid >= " . labelMinid(minLabel());
			}
			if ( maxLabel() ) {
				$pDateRange .= " and pageid <= " . labelMaxid(maxLabel());
			}
		}
		return $pDateRange;
	}
}


function dbtable($table, $device="", $label="", $slice="") {
	if ( "iphone" === $device ) {
		$table .= "mobile";
	}
	else if ( isDev() ) {
		$table .= "dev";
	}

	return $table;
}

// These are interim helper functions for the massive mess of db table global vars
function pagesTable($label="", $slice="", $device="") {
	return dbtable("pages", $device, $label, $slice);
}

function requestsTable($label="", $slice="", $device="") {
	return dbtable("requests", $device, $label, $slice);
}

function statsTable($label="", $slice="", $device="") {
	$table = "stats";
	if ( isDev() ) {
		$table .= "dev";
	}

	return $table;
}

function crawlsTable() {
	return "crawls";
}


// return a where condition to select the appropriate URL slice based on pageid
function sliceCond($label, $slice, $device, $url = "") {
	global $gaTop100, $gaTop1000, $gArchive;

	$pagesTable = pagesTable($label, $slice, $device);
	$dateRange = dateRange();
	$row = doRowQuery("select min(pageid) as minid, max(pageid) as maxid from $pagesTable where label='$label';");
	$minid = $row['minid'];
	$maxid = $row['maxid'];

	$sliceCond = "pageid>=$minid and pageid<=$maxid"; // "All"

	if ( "intersection" === $slice ) {
		// Find the set of URLs that are constant across all labels;
		$archive = getArchive($label);  // only look at intersection across the same *archive*.
		$numLabels = doSimpleQuery("select count(distinct(label)) from $pagesTable where $dateRange and archive='$archive';");
		$query = "select url, count(label) as num from $pagesTable where $dateRange and archive='$archive' group by url having num = $numLabels;";
		$result = doQuery($query);
		$aUrls = array();
		while ( $row = mysql_fetch_assoc($result) ) {
			$aUrls[] = $row['url'];
		}
		mysql_free_result($result);

		$query = "select pageid from $pagesTable where $sliceCond and url in ('" . implode("','", $aUrls) . "');";
		$result = doQuery($query);
		$aPageids = array();
		while ( $row = mysql_fetch_assoc($result) ) {
			$aPageids[] = $row['pageid'];
		}
		mysql_free_result($result);
		$sliceCond = "pageid in ('" . implode("','", $aPageids) . "')";
	}
	else if ( "Top100" === $slice || "Top1000" === $slice ) {
		$urls = ( "Top100" === $slice ? $gaTop100 : $gaTop1000 );
		$query = "select pageid from $pagesTable where $sliceCond and url in ('" . implode("','", $urls) . "');";
		$result = doQuery($query);
		$aPageids = array();
		while ( $row = mysql_fetch_assoc($result) ) {
			$aPageids[] = $row['pageid'];
		}
		mysql_free_result($result);
		$sliceCond = "pageid in (" . implode(",", $aPageids) . ")";
	}
	else if ( "url" === $slice && isset($url) ) {
		$sliceCond .= " and url = '$url'";
	}

	return $sliceCond;
}




////////////////////////////////////////////////////////////////////////////////
//
// PAGES
//
////////////////////////////////////////////////////////////////////////////////

// Return a hash of ALL the data for a given page.
// Bad API: You need EITHER the pageid OR the url & label.
function pageData($pageid, $url = null, $label = null) {
	global $gPagesTable;

	if ( $pageid ) {
		$query = "select * from $gPagesTable where pageid='$pageid';";
	}
	else {
		$query = "select * from $gPagesTable where url='$url' and label='$label';";
	}

	return doRowQuery($query);
}


function urlHasData($url) {
	global $gPagesTable;

	$query = "select count(*) from $gPagesTable where url = '$url';";
	$bHasData = doSimpleQuery($query);

	return $bHasData;
}


// Return the label corresponding to a pageid.
function pageLabel($pageid) {
	global $gPagesTable;

	$query = "select label from $gPagesTable where pageid=$pageid;";
	$label = doSimpleQuery($query);

	return $label;
}



////////////////////////////////////////////////////////////////////////////////
//
// STATS
//
////////////////////////////////////////////////////////////////////////////////

$gaTrendStats = array(
					  "onLoad",
					  "renderStart",
					  "PageSpeed",
					  "reqTotal",
					  "reqHtml",
					  "reqJS",
					  "reqCSS",
					  "reqImg",
					  "reqFlash",
					  "reqJson",
					  "reqOther",
					  "bytesTotal",
					  "bytesHtml",
					  "bytesJS",
					  "bytesCSS",
					  "bytesImg",
					  "bytesFlash",
					  "bytesJson",
					  "bytesOther",
					  "numDomains"
					  );


// return a hash of values for a single stats record
function addStatsData($label, $slice, $device, $hTuples) {
	$hTuples["label"] = $label;
	$hTuples["slice"] = $slice;
	$hTuples["device"] = $device;
	$statstable = statsTable($label, $slice, $device);
	$cmd = "replace into $statstable set " . hashImplode(", ", "=", $hTuples) . ";";

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
function getStatsDataForUrl($label, $slice, $device, $url) {
	$pagesTable = pagesTable($label, $slice, $device);
	$requestsTable = requestsTable($label, $slice, $device);

	// Get the info from the pages table.
	$query = "select * from $pagesTable where label='$label' and url='$url';";
	$hStats = doRowQuery($query);

	// Add other derived info.
	$pageidCond = "pageid=" . $hStats['pageid'];
	$totalRequests = $hStats['reqTotal'];

	// https
	$num = doSimpleQuery("select count(*) from $requestsTable where $pageidCond and url like 'https://%'");
	$hStats['perHttps'] = round(100*$num/$totalRequests);

	// max-age caching
	$query = "select ceil( convert( substring( resp_cache_control, (length(resp_cache_control) + 2 - locate('=ega-xam', reverse(resp_cache_control))) ), SIGNED ) / 86400) as maxagedays, count(*) as num from $requestsTable where $pageidCond and resp_cache_control like '%max-age=%' group by maxagedays order by maxagedays asc;";
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
	$hStats['maxageNull'] = round(100 * ($totalRequests - ($zeroOrNeg + $day + $month + $year + $yearplus))/$totalRequests);
	$hStats['maxage0'] = round(100 * $zeroOrNeg / $totalRequests);
	$hStats['maxage1'] = round(100 * $day / $totalRequests);
	$hStats['maxage30'] = round(100 * $month / $totalRequests);
	$hStats['maxage365'] = round(100 * $year / $totalRequests);
	$hStats['maxageMore'] = round(100 * $yearplus / $totalRequests);


	$row = doRowQuery("select count(*) as req, SUM(respSize) as bytes from $requestsTable where $pageidCond and resp_content_type like '%image/gif%';");
	$hStats['reqGif'] = $row['req'];
	$hStats['bytesGif'] = $row['bytes'];

	$row = doRowQuery("select count(*) as req, SUM(respSize) as bytes from $requestsTable where $pageidCond and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');");
	$hStats['reqJpg'] = $row['req'];
	$hStats['bytesJpg'] = $row['bytes'];

	$row = doRowQuery("select count(*) as req, SUM(respSize) as bytes from $requestsTable where $pageidCond and resp_content_type like '%image/png%';");
	$hStats['reqPng'] = $row['req'];
	$hStats['bytesPng'] = $row['bytes'];

	return $hStats;
}


// Returns a hash where the key is the label (run name, eg, "Oct 1 2011").
// The value for each key is another hash of all the trends data fields. 
function getTrendsData($slice, $device) {
	$statsTable = statsTable(NULL, $slice, $device);

	$query = "select label, numurls" .
		", onLoad, renderStart" .
		", ROUND(reqTotal) as reqTotal, TRUNCATE(reqHtml, 1) as reqHtml, ROUND(reqJS) as reqJS, TRUNCATE(reqCSS, 1) as reqCSS, ROUND(reqImg) as reqImg" .
		", TRUNCATE(reqFlash, 1) as reqFlash, ROUND(bytesTotal/1024) as bytesTotal, ROUND(bytesHtml/1024) as bytesHtml, ROUND(bytesJS/1024) as bytesJS" .
		", ROUND(bytesCSS/1024) as bytesCSS, ROUND(bytesImg/1024) as bytesImg, ROUND(bytesFlash/1024) as bytesFlash" .
		", ROUND(PageSpeed) as PageSpeed, ROUND(numDomains) as numDomains, perFlash, perFonts, perGlibs, maxageNull, perErrors, perHttps, perCompressed, perRedirects" .
		" from $statsTable where slice='$slice' and device='$device';";

	$result = doQuery($query);
	$hTrends = array();
	while ( $row = mysql_fetch_assoc($result) ) {
		$hTrends[$row['label']] = $row;
	}
	mysql_free_result($result);

	return $hTrends;
}


// Returns a hash where the key is the label (run name, eg, "Oct 1 2011").
// The value for each key is another hash of all the trends data fields. 
// WARNING: This is slow and will get slower as we get more data!
// It searches through EVERY RUN!
// ideas:
//   - Add a "urlhash" field to the pages table (same as urls table) - right now we're searching on "url".
//   - Cache trending data per URL - that's a big table.
function getTrendsDataForUrl($url, $device) {
	$pagesTable = pagesTable(NULL, NULL, $device);

	$query = "select label, count(*) as numurls" .
		", reqTotal, reqHtml, reqJS, reqCSS, reqImg" .
		", reqFlash, ROUND(bytesTotal/1024) as bytesTotal, ROUND(bytesHtml/1024) as bytesHtml, ROUND(bytesJS/1024) as bytesJS" .
		", ROUND(bytesCSS/1024) as bytesCSS, ROUND(bytesImg/1024) as bytesImg, ROUND(bytesFlash/1024) as bytesFlash" .
		", ROUND(PageSpeed) as PageSpeed, ROUND(numDomains) as numDomains" .
		" from $pagesTable where url = '$url' group by label;";
	$result = doQuery($query);

	$hTrends = array();
	while ( $row = mysql_fetch_assoc($result) ) {
		$hTrends[$row['label']] = $row;
	}
	mysql_free_result($result);

	return $hTrends;
}


// return a hash of values for a single stats record
function removeStatsData($label, $slice=NULL, $device=NULL) {
	$statstable = statsTable($label, $slice, $device);

	$aWhere = array();
	if ( $label ) {
		$aWhere[] = "label='$label'";
	}
	if ( $slice ) {
		$aWhere[] = "slice='$slice'";
	}
	if ( $device ) {
		$aWhere[] = "device='$device'";
	}
	$sWhere = implode(" and ", $aWhere);
	if ( ! $sWhere ) {
		die("ERROR: need to specificy paraeters to removeStatsData.\n");
	}

	$cmd = "delete from $statstable where $sWhere" . ";";
	doSimpleCommand($cmd);

	return true;
}


// Fill in any missing stats - This is complex given the ease of computing SOME stats
// while other stats are VERY time consuming to compute.
// return a hash of stats
function updateStatsData($label, $slice, $device) {
	// Get any existing stats (potentially old with gaps, possibly missing altogether).
	$hStats = getStatsData($label, $slice, $device);
	
	if ( ! $hStats ) {
		// No stats! Re-compute EVERYTHING!
		$hStats = computeStatsData($label, $slice, $device);
	}
	else {
		$sliceCond = sliceCond($label, $slice, $device);  // this might be expensive - compute it once
		$newStats = computeTrendStats($label, $slice, $device, $sliceCond);
		// TODO - We don't try to update these for now.
		//$hStats += computeCorrelations($label, $slice, $device, $sliceCond, "onLoad");
		//$hStats += computeCorrelations($label, $slice, $device, $sliceCond, "renderStart");
		computeOther($label, $slice, $device, $sliceCond, $hStats);
        $hStats = array_merge($hStats, $newStats); // $newStats will overwrite $hStats for duplicate keys
	}

	return addStatsData($label, $slice, $device, $hStats);
}


// return a hash of stats
// (FYI - we NEVER enter here with $slice = "url")
function computeStatsData($label, $slice, $device) {
	$hStats = array();
	$sliceCond = sliceCond($label, $slice, $device);  // this might be expensive - compute it once
	$hStats += computeTrendStats($label, $slice, $device, $sliceCond);
	$hStats += computeCorrelations($label, $slice, $device, $sliceCond, "onLoad");
	$hStats += computeCorrelations($label, $slice, $device, $sliceCond, "renderStart");
	$hStats += computeOther($label, $slice, $device, $sliceCond);

	return $hStats;
}


function computeTrendStats($label, $slice, $device, $sliceCond) {
	global $gArchive;

	$aFields = trendStatsFields();
	$pagesTable = pagesTable($label, $slice, $device);

	$query = "select count(*) as numurls";
	foreach ($aFields as $field) {
		// HACK - we massage the resulting number based on the field's label - yuck!
		$query .= ( false === strpos($field, "bytes")
					? ", TRUNCATE(AVG($field), 1) as $field"   // truncate requests to 1 decimal place
					: ", ROUND(AVG($field)) as $field" );      // round bytes to nearest integer
	}
	$query .= " from $pagesTable where archive = '$gArchive' and label='$label' and $sliceCond;";

	$row = doRowQuery($query);

	return $row;
}


function trendStatsFields() {
	global $gaTrendStats;
	return $gaTrendStats;
}


function computeCorrelations($label, $slice, $device, $sliceCond, $var1) {
	$pagesTable = pagesTable($label, $slice, $device);

	// TODO - make this more flexible
	$hCC = array(); // hash key is the CC *VALUE*
	$aVars = array("PageSpeed", "reqTotal", "reqHtml", "reqJS", "reqCSS", "reqImg", "reqFlash", "reqJson", "reqOther", "bytesTotal", "bytesHtml", "bytesJS", "bytesCSS", "bytesImg", "bytesFlash", "bytesJson", "bytesOther", "numDomains");
	foreach ($aVars as $var2) {
		// from http://www.freeopenbook.com/mysqlcookbook/mysqlckbk-chp-13-sect-6.html
		$cmd = "SELECT @n := COUNT($var1) AS n, @sumX := SUM($var2) AS 'sumX', @sumXX := SUM($var2*$var2) AS 'sumXX', @sumY := SUM($var1) AS 'sumY', @sumYY := SUM($var1*$var1) AS 'sumYY', @sumXY := SUM($var2*$var1) AS 'sumXY' FROM $pagesTable where $sliceCond and $var2 is not null and $var2 > 0;";
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

	// Take the CC values(!) in descending order and return the top 5 results.
	$aCC = array_keys($hCC);
	rsort($aCC, SORT_NUMERIC);
	$iRows = 0;
	$hTuples = array();
	foreach($aCC as $cc) {
		$prettyCC = round($cc*100)/100;
		foreach($hCC[$cc] as $var2) {
			$iRows++;
			$hTuples[$var1 . "ccf$iRows"] = $var2;
			$hTuples[$var1 . "ccv$iRows"] = $prettyCC;
			if ( 5 <= $iRows ) {
				break;
			}
		}
		if ( 5 <= $iRows ) {
			break;
		}
	}

	return $hTuples;
}


// "Special" stats that often require a more complex query against the requests table.
function computeOther($label, $slice, $device, $sliceCond, &$hTuples = array()) {
	$pagesTable = pagesTable($label, $slice, $device);
	$requestsTable = requestsTable($label, $slice, $device);

	// total page & request count so we can do percentages
	$totalPages = doSimpleQuery("select count(*) from $pagesTable where $sliceCond;");
	$totalRequests = doSimpleQuery("select count(*) from $requestsTable where $sliceCond;");

	// redirects
	if ( null === $hTuples['perRedirects'] ) {
		$num = doSimpleQuery("select count(distinct pageid) from $requestsTable where $sliceCond and status>=300 and status<400 and status!=304;");
		$hTuples['perRedirects'] = round(100*$num/$totalPages);
	}

	// errors
	if ( null === $hTuples['perErrors'] ) {
		$num = doSimpleQuery("select count(distinct pageid) from $requestsTable where $sliceCond and status>=400 and status<600;");
		$hTuples['perErrors'] = round(100*$num/$totalPages);
	}

	// flash usage
	if ( null === $hTuples['perFlash'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and reqFlash > 0;");
		$hTuples['perFlash'] = round(100*$num/$totalPages);
	}

	// custom fonts
	if ( null === $hTuples['perFonts'] ) {
		$num = doSimpleQuery("select count(distinct pageid) from $requestsTable where $sliceCond and ( " .
							 "(resp_content_type like '%font%') or " .   // content-type contains "font"
							 "(urlShort like 'http://use.typekit.%' and resp_content_type = 'text/css') or " . // TypeKit CSS with data: URIs
							 "(url like '%.eot' or url like '%.eot?%' or url like '%.ttf' or url like '%.ttf?%' or url like '%.ttc' or url like '%.ttc?%' or url like '%.woff' or url like '%.woff?%' or url like '%.otf' or url like '%.otf?%')" . // file extension
							 ");");
		$hTuples['perFonts'] = round(100*$num/$totalPages);
	}

	// Google Ajax Libraries	
	if ( null === $hTuples['perGlibs'] ) {
		$num = doSimpleQuery("select count(distinct pageid) from $requestsTable where $sliceCond and url like '%googleapis.com%';");
		$hTuples['perGlibs'] = round(100*$num/$totalPages);
	}

	// https
	if ( null === $hTuples['perHttps'] ) {
		$num = doSimpleQuery("select count(*) from $requestsTable where $sliceCond and url like 'https://%'");
		$hTuples['perHttps'] = round(100*$num/$totalRequests);
	}


	// max-age caching
	if ( null === $hTuples['maxageNull'] ) {
		$query = "select ceil( convert( substring( resp_cache_control, (length(resp_cache_control) + 2 - locate('=ega-xam', reverse(resp_cache_control))) ), SIGNED ) / 86400) as maxagedays, count(*) as num from $requestsTable where $sliceCond and resp_cache_control like '%max-age=%' group by maxagedays order by maxagedays asc;";
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
		$hTuples['maxageNull'] = round(100 * ($totalRequests - ($zeroOrNeg + $day + $month + $year + $yearplus))/$totalRequests);
		$hTuples['maxage0'] = round(100 * $zeroOrNeg / $totalRequests);
		$hTuples['maxage1'] = round(100 * $day / $totalRequests);
		$hTuples['maxage30'] = round(100 * $month / $totalRequests);
		$hTuples['maxage365'] = round(100 * $year / $totalRequests);
		$hTuples['maxageMore'] = round(100 * $yearplus / $totalRequests);
	}

	// requests and bytes for GIF, JPG, and PNG
	if ( null === $hTuples['reqGif'] ) {
		$row = doRowQuery("select count(*) as req, TRUNCATE(AVG(respSize), 1) as bytes from $requestsTable where $sliceCond and resp_content_type like '%image/gif%';");
		$hTuples['reqGif'] = $row['req'] / $totalPages;
		$hTuples['bytesGif'] = ($row['req'] / $totalPages) * $row['bytes'];

		$row = doRowQuery("select count(*) as req, TRUNCATE(AVG(respSize), 1) as bytes from $requestsTable where $sliceCond and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');");
		$hTuples['reqJpg'] = $row['req'] / $totalPages;
		$hTuples['bytesJpg'] = ($row['req'] / $totalPages) * $row['bytes'];

		$row = doRowQuery("select count(*) as req, TRUNCATE(AVG(respSize), 1) as bytes from $requestsTable where $sliceCond and resp_content_type like '%image/png%';");
		$hTuples['reqPng'] = $row['req'] / $totalPages;
		$hTuples['bytesPng'] = ($row['req'] / $totalPages) * $row['bytes'];
	}

	// gzip
	if ( null === $hTuples['perCompressed'] ) {
		$query = "select resp_content_encoding, count(*) as num from $requestsTable where $sliceCond and respSize > 1024 and mimeType in ('text/html', 'application/x-javascript', 'text/javascript', 'text/css', 'application/javascript', 'text/plain', 'text/xml', 'font/eot', 'application/xml', 'application/json', 'text/json', 'text/js') group by resp_content_encoding order by num desc;";
		$result = doQuery($query);
		$total = $compressed = 0;
		while ($row = mysql_fetch_assoc($result)) {
			$encoding = $row['resp_content_encoding'];
			$num = $row['num'];
			$total += $num;
			if ( "gzip" === $encoding || "deflate" === $encoding ) {
				// There are other possible values (like ", gzip") but they're tiny, < 0.00001%.
				$compressed += $num;
			}
		}
		$hTuples['perCompressed'] = round(100*$compressed/$total);
	}

	return $hTuples;
}


// Add the end of a crawl we compute the stats and then copy them to production.
function copyStatsToTable($statsTableSource, $statsTableTarget) {
	//doSimpleCommand("insert into $statsTableTarget select * from $statsTableSource;");
}




////////////////////////////////////////////////////////////////////////////////
//
// URLS - the table used by bulktest
//
////////////////////////////////////////////////////////////////////////////////





////////////////////////////////////////////////////////////////////////////////
//
// STATUS - the table used by bulktest
//
////////////////////////////////////////////////////////////////////////////////

function addStatusData($url, $loc, $label, $rank=NULL) {
	global $gStatusTable, $gArchive;
	$now = time();
	$cmd = "REPLACE INTO $gStatusTable SET url = '" . mysql_real_escape_string($url) . 
		"' , location = '" . mysql_real_escape_string($loc) . 
		"', archive = '$gArchive', label = '$label'" . 
		( $rank ? ", rank = $rank" : "" ) .
		", status = '" . NOT_STARTED . "', timeofLastChange = '$now';";
	doSimpleCommand($cmd);
}


function removeAllStatusData() {
	global $gStatusTable;
	$cmd = "TRUNCATE TABLE $gStatusTable;";
	doSimpleCommand($cmd);
}


// return the label for the current crawl in the status table (there should be only one)
function statusLabel() {
	global $gStatusTable;
	return doSimpleQuery("select distinct(label) from $gStatusTable;");  // there should only be one
}


// return the number of errors
function statusErrors() {
	global $gStatusTable, $gErrBase;
	return doSimpleQuery("select count(*) from $gStatusTable where status >= $gErrBase;");
}




////////////////////////////////////////////////////////////////////////////////
//
// CRAWLS - meta-information about each crawl (AKA "run")
//
////////////////////////////////////////////////////////////////////////////////
function createCrawl($hTuples) {
	$crawlsTable = crawlsTable();
	$now = time();
	$cmd = "insert into $crawlsTable set " . hashImplode(", ", "=", $hTuples) . ", timeOfLastChange = $now;";
	doSimpleCommand($cmd);
	return true;
}


function updateCrawl($label, $archive, $location, $hTuples) {
	$crawlsTable = crawlsTable();
	$now = time();
	$cmd = "update $crawlsTable set " . hashImplode(", ", "=", $hTuples) . ", timeOfLastChange = $now where label='$label' and archive='$archive' and location='$location';";
	doSimpleCommand($cmd);
	return true;
}


// increment the number of passes for this crawl
// return the resulting number of passes
function crawlPasses($label, $archive, $location) {
	$crawlsTable = crawlsTable();
	return doSimpleQuery("select passes from $crawlsTable where label='$label' and archive='$archive' and location='$location';");
}


////////////////////////////////////////////////////////////////////////////////
//
// DATA
//
////////////////////////////////////////////////////////////////////////////////

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




//
//
// MYSQL
//
//
function doSimpleCommand($cmd) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword, $new_link=true);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doSimpleCommand: $cmd");
		$result = mysql_query($cmd, $link);
		//mysql_close($link); // the findCorrelation code relies on the link not being closed
		if ( ! $result ) {
			dprint("ERROR in doSimpleCommand: '" . mysql_error() . "' for command: " . $cmd);
		}
	}
}


function doQuery($query) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword, $new_link=true);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doQuery: $query");
		$result = mysql_query($query, $link);
		//mysql_close($link); // the findCorrelation code relies on the link not being closed
		if ( FALSE === $result ) {
			dprint("ERROR in doQuery: '" . mysql_error() . "' for query: " . $query);
		}
		return $result;
	}

	return null;
}


// return the first row
function doRowQuery($query) {
	$row = NULL;
	$result = doQuery($query);
	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		mysql_free_result($result);
	}

	return $row;
}


// return the first value from the first row
function doSimpleQuery($query) {
	$value = NULL;
	$result = doQuery($query);

	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		if ( $row ) {
			$aKeys = array_keys($row);
			$value = $row[$aKeys[0]];
		}
		mysql_free_result($result);
	}

	return $value;
}


function tableExists($tablename) {
	return ( $tablename == doSimpleQuery("show tables like '$tablename';") );
}


/*******************************************************************************
SCHEMA CHANGES:
  This is a record of changes to the schema and how the tables were updated 
  in place.

12/1/10 - Added the "pageid" index to requestsdev. 
  This made the aggregateStats function 10x faster during import.
  mysql> create index pageid on requestsdev (pageid);

7/21/2011 - Added the "rank" column to pages table:
  mysql> alter table pagesdev add column rank int(10) unsigned after PageSpeed;

Oct 27, 2011 - Remove "harfile" column and reset unique index. Shorten columns.
  mysql> alter table pagesdev modify column archive varchar (16) not null;
  mysql> alter table pagesdev modify column label varchar (32) not null;
  mysql> drop index startedDateTime on pagesdev;
  mysql> alter table pagesdev add unique key (label, urlShort);
  mysql> alter table pagesdev drop column harfile;

Nov 3, 2011 - add "rank" column to status table
  mysql> drop table statusdev; drop table statusmobile;

Nov 16, 2011 - add perFonts column to stats table
  mysql> alter table statsdev add column perFonts int(4) unsigned after perFlash;

April 5, 2012 - add urlhash to urls table for faster lookup
  mysql> alter table urls add column urlhash int(8) unsigned first;
  mysql> update urls set urlhash = conv(substring(md5(urlOrig),1,4),16,10);
  mysql> create index urlhash on urls (urlhash);

Oct 26, 2012 - add new stats columns
mysql> alter table statsdev add column renderStart int(10) unsigned after PageSpeed;
mysql> alter table statsdev add column onLoad int(10) unsigned after renderStart;
mysql> alter table statsdev add column perCompressed int(4) unsigned after perHttps;
mysql> alter table statsdev modify perHttps int(4) unsigned;


*******************************************************************************/
function createTables() {
	global $gPagesTable, $gRequestsTable, $gStatusTable, $gStatsTable, $gUrlsTable, $gUrlsChangeTable, $gSettingsTable;
	global $ghReqHeaders, $ghRespHeaders;

	if ( ! tableExists($gPagesTable) ) {
		$command = "create table $gPagesTable (" .
			"pageid int unsigned not null auto_increment" .
			", createDate int(10) unsigned not null" .
			", archive varchar (16) not null" .
			", label varchar (32) not null" .
			", wptid varchar (64) not null" .        // webpagetest.org id
			", wptrun int(2) unsigned not null" .    // webpagetest.org median #
			", title varchar (255) not null" .
			", url text" .
			", urlShort varchar (255)" .
			", urlHtml text" .
			", urlHtmlShort varchar (255)" .
			", startedDateTime int(10) unsigned" .
			", renderStart int(10) unsigned" .
			", onContentLoaded int(10) unsigned" .
			", onLoad int(10) unsigned" .
			", PageSpeed int(4) unsigned" .
			", rank int(10) unsigned" .

			", reqTotal int(4) unsigned not null" .
			", reqHtml int(4) unsigned not null" .
			", reqJS int(4) unsigned not null" .
			", reqCSS int(4) unsigned not null" .
			", reqImg int(4) unsigned not null" .
			", reqFlash int(4) unsigned not null" .
			", reqJson int(4) unsigned not null" .
			", reqOther int(4) unsigned not null" .

			", bytesTotal int(10) unsigned not null" .
			", bytesHtml int(10) unsigned not null" .
			", bytesJS int(10) unsigned not null" .
			", bytesCSS int(10) unsigned not null" .
			", bytesImg int(10) unsigned not null" .
			", bytesFlash int(10) unsigned not null" .
			", bytesJson int(10) unsigned not null" .
			", bytesOther int(10) unsigned not null" .

			", numDomains int(4) unsigned not null" .
			", primary key (pageid)" .
			", unique key (label, urlShort)" .
			");";
		doSimpleCommand($command);
	}

	if ( ! tableExists($gRequestsTable) ) {
		$sColumns = "";
		$aColumns = array_values($ghReqHeaders);
		sort($aColumns);
		for ( $i = 0; $i < count($aColumns); $i++ ) {
			$column = $aColumns[$i];
			$sColumns .= ", $column varchar (255)";
		}
		$aColumns = array_values($ghRespHeaders);
		sort($aColumns);
		for ( $i = 0; $i < count($aColumns); $i++ ) {
			$column = $aColumns[$i];
			$sColumns .= ", $column varchar (255)";
		}

		$command = "create table $gRequestsTable (" .
			"requestid int unsigned not null auto_increment" .
			", pageid int unsigned not null" .

			", startedDateTime int(10) unsigned" .
			", time int(10) unsigned" .
			", method varchar (32)" .
			", url text" .
			", urlShort varchar (255)" .
			", redirectUrl text" .
			", redirectUrlShort varchar (255)" .
			", firstReq tinyint(1) not null" .
			", firstHtml tinyint(1) not null" .

			// req
			", reqHttpVersion varchar (32)" .
			", reqHeadersSize int(10) unsigned" .
			", reqBodySize int(10) unsigned" .
			", reqCookieLen int(10) unsigned not null".
			", reqOtherHeaders text" .

			// response
			", status int(10) unsigned" .
			", respHttpVersion varchar (32)" .
			", respHeadersSize int(10) unsigned" .
			", respBodySize int(10) unsigned" .
			", respSize int(10) unsigned" .
			", respCookieLen int(10) unsigned not null".
			", mimeType varchar(255)" .  // slightly normalized version of resp_content_type - ~1000 distinct values
			", respOtherHeaders text" .

			// headers
			$sColumns .

			", primary key (requestid)" .
			", index(pageid)" .
			", unique key (startedDateTime, pageid, urlShort)" .
			");";
		doSimpleCommand($command);
	}

	// Create Status Table
	if ( ! tableExists($gStatusTable) ) {
		$command = "create table $gStatusTable (" .
			"statusid int unsigned not null auto_increment" .
			", url text" .
			", location varchar (32) not null" .
			", archive varchar (32) not null" .
			", label varchar (32) not null" .
			", rank int(10) unsigned" .
			", status varchar (32) not null" .
			", attempts int(2) not null" .  // how many times we've tried the URL so we can re-submit failures
			", timeOfLastChange int(10) unsigned not null" .
			", wptid varchar (64)" .
			", wptRetCode varchar (8)" .
			", medianRun int(4) unsigned" .
			", startRender int(10) unsigned" .
			", pagespeedScore int(4) unsigned" .
			", primary key (statusid)" .
			", index(statusid)" .
			");";
		doSimpleCommand($command);
	}

	// Create Status Table
	$crawlsTable = crawlsTable();
	if ( ! tableExists( $crawlsTable ) ) {
		$command = "create table $crawlsTable (" .
			"crawlid int unsigned not null auto_increment" .
			", label varchar (32) not null" .
			", archive varchar (32) not null" .
			", location varchar (32) not null" . // AKA "device" - the WPT location value
			", video boolean not null" .         // true = video was recorded
			", docComplete boolean not null" .   // true = stopped at onload; false = ran later
			", fvonly boolean not null" .        // true = first view only
			", runs int(4) unsigned" .           // the number of runs for each URL (we use the median)

			", startedDateTime int(10) unsigned" .
			", finishedDateTime int(10) unsigned" .
			", timeOfLastChange int(10) unsigned not null" .
			", passes int(2) unsigned" .         // the number of passes thru the URLs - we typically do 2 (retry errors)


			", minPageid int unsigned not null" .
			", maxPageid int unsigned not null" .
			", numUrls int unsigned" .     // # of URLs submitted
			", numErrors int unsigned" .   // # of URLs that failed
			", numPages int unsigned" .    // # of URLs that resulted in valid pages
			", numRequests int unsigned" . // # of requests for all the pages

			", primary key (crawlid)" .
			", index(label, archive, location)" .
			");";
		doSimpleCommand($command);
	}

	if ( ! tableExists($gStatsTable) ) {
		$command = "create table $gStatsTable (" .
			"label varchar (32) not null" .           // "Oct 1 2011"
			", slice varchar (32) not null" .         // "Top100", "Top1000", "intersection", or "All"
			", device varchar (32) not null" .        // "iphone43", "isim", or "IE8"
			", version int(6) unsigned not null" .    // the SVN version # so we can track what values to recompute
			", numurls int unsigned" .                // even "Top100" might only be 98 URLs

			// averages across ALL SITES in the slice
			", PageSpeed float unsigned" .
			", renderStart int(10) unsigned" .
			", onLoad int(10) unsigned" .
			", numDomains float unsigned" .
			", reqTotal float unsigned" .
			", reqHtml float unsigned" .
			", reqJS float unsigned" .
			", reqCSS float unsigned" .
			", reqImg float unsigned" .
			", reqGif float unsigned" .
			", reqJpg float unsigned" .
			", reqPng float unsigned" .
			", reqFlash float unsigned" .
			", reqJson float unsigned" .
			", reqOther float unsigned" .
			", bytesTotal int(10) unsigned" .
			", bytesHtml int(10) unsigned" .
			", bytesJS int(10) unsigned" .     // eg, average total bytes of JS downloaded per page
			", bytesCSS int(10) unsigned" .
			", bytesImg int(10) unsigned" .
			", bytesGif int(10) unsigned" .
			", bytesJpg int(10) unsigned" .
			", bytesPng int(10) unsigned" .
			", bytesFlash int(10) unsigned" .
			", bytesJson int(10) unsigned" .
			", bytesOther int(10) unsigned" .

			// % of sites with at least one of these conditions
			", perRedirects int(4) unsigned" .
			", perErrors int(4) unsigned" .
			", perFlash int(4) unsigned" .
			", perFonts int(4) unsigned" .
			", perGlibs int(4) unsigned" .
/*
			// % of sites that use this JS library
			", perjQuery float unsigned" .
			", perYUI float unsigned" .
			", perDojo float unsigned" .
			", perGA float unsigned" .
			", perQuantcast float unsigned" .
			", perAddThis float unsigned" .
			", perFacebook float unsigned" .
			", perGPlusOne float unsigned" .
			", perTwitter float unsigned" .
			", perShareThis float unsigned" .
*/
			// % of requests
			", perHttps int(4) unsigned" .
			", perCompressed int(4) unsigned" . 

			// % of sites with max-age in this range
			// "maxage30" === maxage > 1 day AND maxage <= 30 days
			", maxageNull int(4) unsigned" .
			", maxage0 int(4) unsigned" .
			", maxage1 int(4) unsigned" .
			", maxage30 int(4) unsigned" .
			", maxage365 int(4) unsigned" .
			", maxageMore int(4) unsigned" .

			// correlation coefficients: top 5 correlations for onload and render
			", onLoadccf1 varchar (32)" .
			", onLoadccv1 float unsigned" .
			", onLoadccf2 varchar (32)" .
			", onLoadccv2 float unsigned" .
			", onLoadccf3 varchar (32)" .
			", onLoadccv3 float unsigned" .
			", onLoadccf4 varchar (32)" .
			", onLoadccv4 float unsigned" .
			", onLoadccf5 varchar (32)" .
			", onLoadccv5 float unsigned" .
			", renderStartccf1 varchar (32)" .
			", renderStartccv1 float unsigned" .
			", renderStartccf2 varchar (32)" .
			", renderStartccv2 float unsigned" .
			", renderStartccf3 varchar (32)" .
			", renderStartccv3 float unsigned" .
			", renderStartccf4 varchar (32)" .
			", renderStartccv4 float unsigned" .
			", renderStartccf5 varchar (32)" .
			", renderStartccv5 float unsigned" .

			", primary key (label, slice, device)" .
			");";
		doSimpleCommand($command);
	}

	// Create Urls Table
	if ( ! tableExists($gUrlsTable) ) {
		$command = "create table $gUrlsTable (" .
			"urlhash int(8) unsigned" .
			", urlOrig text character set binary" . // use "binary" so it's case *sensitive*
			", urlFixed text" .
			", rank int(10) unsigned" .
			", ranktmp int(10) unsigned" . // use this while we're updating the rank every night
			", other boolean not null" .   // is this URL from some other source and we should crawl it EVERY time
			", optout boolean not null" .  // did the website owner ask us NOT to crawl their site
			", primary key (urlOrig(255))" .
			", index(urlhash)" .
			");";
		doSimpleCommand($command);
	}

	// Create Urls Change Table
	// If someone chooses to have their site removed, we queue the request here.
	if ( ! tableExists($gUrlsChangeTable) ) {
		$command = "create table $gUrlsChangeTable (" .
			"url text character set binary" . // use "binary" so it's case *sensitive*
			", action varchar(16)" .  // "add", "remove" for now
			", createDate int(10) unsigned not null" .
			", primary key (url(255), action)" .
			");";
		doSimpleCommand($command);
	}

	// Create Settings Table
	if ( ! tableExists($gSettingsTable) ) {
		$command = "create table $gSettingsTable (" .
			"setting varchar (64)" .
			", val varchar (255)" .
			", primary key (setting)" .
			");";
		doSimpleCommand($command);
	}
}

?>
