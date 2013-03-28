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


function addStats($label, $slice, $device, $hStats=null) {
	if ( getStatsData($label, $slice, $device) ) {
		return true;
	}

	if ( ! $hStats ) {
		$hStats = computeStats($label, $slice, $device);
	}

	return addStatsData($label, $slice, $device, $hStats);
}


function replaceStats($label, $slice=null, $device=null, $hStats=null) {
	$device = ( $device ? $device : curDevice() );

	if ( $slice ) {
		if ( ! $hStats ) {
			$hStats = computeStats($label, $slice, $device);
		}
		removeStats($label, $slice, $device);
		addStatsData($label, $slice, $device, $hStats);
	}
	else {
		// If $slice is NOT provided, do ALL slices (eg, "All", "Top1000", "Top100").
		$aSlices = sliceNames(false);
		foreach ( $aSlices as $slice ) {
			$hStats = computeStats($label, $slice, $device);
			removeStats($label, $slice, $device);
			addStatsData($label, $slice, $device, $hStats);
		}
	}
}


function getStats($label, $slice, $device, $url=NULL) {
	if ( $url ) {
		return getStatsDataForUrl($label, $slice, $device, $url);
	}
		
	$hStats = getStatsData($label, $slice, $device);
	if ( ! $hStats ) {
		// We do NOT want to do this because it might get called in the middle of a run.
		//addStats($label, $slice, $device);
		//$hStats = getStatsData($label, $slice, $device);
	}

	return $hStats;
}


function getTrends($slice, $device, $url=NULL) {
	if ( $url ) {
		return getTrendsDataForUrl($url, $device);
	}
	else {
		return getTrendsData($slice, $device);
	}
}


// If $bUpdate = false then only compute stats if there are NO stats for the run (ie, the entire row is missing).
function computeMissingStats($device, $bVerbose = false, $bUpdate = false, $label = null) {
	$aDevices = ( $device ? array($device) : allDevices() );
	$aLabels = ( $label ? array($label) : archiveLabels(null, false, "n/j/y", true) );
	$aSlices = sliceNames();
	foreach ( $aDevices as $device ) {
		for ( $i = count($aLabels)-1; $i >= 0; $i-- ) {
			// do labels in reverse chrono order so newest are ready first
			$label = $aLabels[$i];
			foreach ( $aSlices as $slice ) {
				if ( $bUpdate ) {
					if ( $bVerbose ) { lprint("updating $label $slice $device..."); }
					updateStats($label, $slice, $device);
					if ( $bVerbose ) { lprint("DONE"); }
				}
				else if ( ! getStatsData($label, $slice, $device) ) {
					if ( $bVerbose ) { lprint("adding $label $slice $device..."); }
					addStats($label, $slice, $device);
					if ( $bVerbose ) { lprint("DONE"); }
				}
			}
		}
	}
}


// TODO - from dbapi.inc


////////////////////////////////////////////////////////////////////////////////
//
// STATS
//
////////////////////////////////////////////////////////////////////////////////

// List of fields (including mysql massaging) for selecting data from the "pages" table and saving to the "stats" table.
$gaTrendsCompute = array(
					  "ROUND(AVG(onLoad)) as onLoad",
					  "ROUND(AVG(TTFB)) as TTFB",
					  "ROUND(AVG(renderStart)) as renderStart",
					  "ROUND(AVG(visualComplete)) as visualComplete",
					  "ROUND(AVG(fullyLoaded)) as fullyLoaded",
					  "ROUND(AVG(PageSpeed)) as PageSpeed",
					  "ROUND(AVG(SpeedIndex)) as SpeedIndex",
					  "ROUND(AVG(bytesHtmlDoc)) as bytesHtmlDoc",
					  "ROUND(AVG(gzipTotal)) as gzipTotal",
					  "ROUND(AVG(gzipSavings)) as gzipSavings",
					  "ROUND(AVG(numDomElements)) as numDomElements",
					  "ROUND(AVG(numDomains)) as numDomains",
					  "ROUND(AVG(maxDomainReqs)) as maxDomainReqs",

					  "TRUNCATE(AVG(reqTotal), 1) as reqTotal",
					  "TRUNCATE(AVG(reqHtml), 1) as reqHtml",
					  "TRUNCATE(AVG(reqJS), 1) as reqJS",
					  "TRUNCATE(AVG(reqCSS), 1) as reqCSS",
					  "TRUNCATE(AVG(reqImg), 1) as reqImg",
					  "TRUNCATE(AVG(reqFlash), 1) as reqFlash",
					  //"TRUNCATE(AVG(reqJson), 1) as reqJson", // too hard to identify based on mimeType
					  "TRUNCATE(AVG(reqOther), 1) as reqOther",
					  "TRUNCATE(AVG(reqFont), 1) as reqFont",
					  "TRUNCATE(AVG(reqGif), 1) as reqGif",
					  "TRUNCATE(AVG(reqJpg), 1) as reqJpg",
					  "TRUNCATE(AVG(reqPng), 1) as reqPng",
					  "ROUND(AVG(bytesTotal)) as bytesTotal",
					  "ROUND(AVG(bytesHtml)) as bytesHtml",
					  "ROUND(AVG(bytesJS)) as bytesJS",
					  "ROUND(AVG(bytesCSS)) as bytesCSS",
					  "ROUND(AVG(bytesImg)) as bytesImg",
					  "ROUND(AVG(bytesFlash)) as bytesFlash",
					  //"ROUND(AVG(bytesJson)) as bytesJson", // too hard to identify based on mimeType
					  "ROUND(AVG(bytesOther)) as bytesOther",
					  "ROUND(AVG(bytesFont)) as bytesFont",
					  "ROUND(AVG(bytesGif)) as bytesGif",
					  "ROUND(AVG(bytesJpg)) as bytesJpg",
					  "ROUND(AVG(bytesPng)) as bytesPng"
					  );


// List of fields (including mysql massaging) to extract from the "stats" table to show as trend charts.
// This list is used for labels AND for individual websites.
$gaTrendsGet = array(
					 "onLoad",
					 "TTFB",
					 "renderStart",
					 "visualComplete",
					 "fullyLoaded",
					 "PageSpeed",
					 "SpeedIndex",
					 "ROUND(bytesHtmlDoc/1024) as bytesHtmlDoc",
					 // gzipTotal?
					 // gzipSavings?
					 "numDomElements",
					 "numDomains",
					 "maxDomainReqs",
					 "maxage0",

					 "ROUND(reqTotal) as reqTotal",       // if there are A LOT of requests, do ROUND
					 "TRUNCATE(reqHtml, 1) as reqHtml",   // if there are A FEW requests, show a float
					 "ROUND(reqJS) as reqJS",
					 "TRUNCATE(reqCSS, 1) as reqCSS",
					 "ROUND(reqImg) as reqImg",
					 "TRUNCATE(reqFlash, 1) as reqFlash",
					 "TRUNCATE(reqFont, 1) as reqFont",
					 "TRUNCATE(reqOther, 1) as reqOther",
					 "ROUND(bytesTotal/1024) as bytesTotal",
					 "ROUND(bytesHtml/1024) as bytesHtml",
					 "ROUND(bytesJS/1024) as bytesJS",
					 "ROUND(bytesCSS/1024) as bytesCSS",
					 "ROUND(bytesImg/1024) as bytesImg",
					 "ROUND(bytesFlash/1024) as bytesFlash",
					 "ROUND(bytesFont/1024) as bytesFont",
					 "ROUND(bytesOther/1024) as bytesOther"
					 );


// List of fields (including mysql massaging) to extract from the "stats" table to show as trend charts.
// This list is used for labels only (NOT websites);
$gaTrendsGetLabel = array(
						  "perFlash",
						  "perFonts",
						  "perGlibs",
						  "perErrors",
						  "perHttps",
						  "perCompressed",
						  "perRedirects",
						  "perCdn"
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

	// Get the info from the pages table.
	$query = "select * from $pagesTable where label='$label' and url='$url';";
	$hStats = doRowQuery($query);

	// Add other derived info.
	$pageidCond = "pageid=" . $hStats['pageid'];
	$totalRequests = $hStats['reqTotal'];

	// https
	$hStats['perHttps'] = round(100*$hStats['numHttps']/$totalRequests);

	// max-age caching - convert absolute count to percentage
	$hStats['maxageNull'] = round(100 * $hStats['maxageNull']/$totalRequests);
	$hStats['maxage0'] = round(100 * $hStats['maxage0'] / $totalRequests);
	$hStats['maxage1'] = round(100 * $hStats['maxage1'] / $totalRequests);
	$hStats['maxage30'] = round(100 * $hStats['maxage30'] / $totalRequests);
	$hStats['maxage365'] = round(100 * $hStats['maxage365'] / $totalRequests);
	$hStats['maxageMore'] = round(100 * $hStats['maxageMore'] / $totalRequests);

	return $hStats;
}


// Returns a hash where the key is the label (run name, eg, "Oct 1 2011").
// The value for each key is another hash of all the trends data fields. 
function getTrendsData($slice, $device) {
	global $gaTrendsGet, $gaTrendsGetLabel;

	$statsTable = statsTable(NULL, $slice, $device);

	// TODO - This hardcoded list of DB fields must be synced with the list in trends.inc.
	$query = "select label" .
		", numurls" .
		", " . implode(", ", $gaTrendsGet) .
		", " . implode(", ", $gaTrendsGetLabel) .
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
	global $gaTrendsGet;

	$pagesTable = pagesTable(NULL, NULL, $device);

	$query = "select label" .
		", count(*) as numurls" .
		", " . implode(", ", $gaTrendsGet) .
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
function removeStats($label, $slice=NULL, $device=NULL) {
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
		tprint("ERROR: need to specificy paraeters to removeStats.\n");
		return NULL;
	}

	$statstable = statsTable($label, $slice, $device);
	$cmd = "delete from $statstable where $sWhere" . ";";
	doSimpleCommand($cmd);

	return true;
}


// Fill in any missing stats - This is complex given the ease of computing SOME stats
// while other stats are VERY time consuming to compute.
// return a hash of stats
function updateStats($label, $slice, $device) {
	// Get any existing stats (potentially old with gaps, possibly missing altogether).
	$hStats = getStatsData($label, $slice, $device);
	
	if ( ! $hStats ) {
		// No stats! Re-compute EVERYTHING!
		$hStats = computeStats($label, $slice, $device);
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
function computeStats($label, $slice, $device) {
	$hStats = array();
	$sliceCond = sliceCond($label, $slice, $device);  // this might be expensive - compute it once
	$hStats += computeTrendStats($label, $slice, $device, $sliceCond);
	$hStats += computeCorrelations($label, $slice, $device, $sliceCond, "onLoad");
	$hStats += computeCorrelations($label, $slice, $device, $sliceCond, "renderStart");
	$hStats += computeOther($label, $slice, $device, $sliceCond);

	return $hStats;
}


function computeTrendStats($label, $slice, $device, $sliceCond) {
	global $gArchive, $gaTrendsCompute;

	$aFields = $gaTrendsCompute;
	$pagesTable = pagesTable($label, $slice, $device);

	$query = "select count(*) as numurls, " .
		implode(", ", $gaTrendsCompute) . 
		" from $pagesTable where archive = '$gArchive' and label='$label' and $sliceCond;";

	$row = doRowQuery($query);

	return $row;
}


function computeCorrelations($label, $slice, $device, $sliceCond, $var1) {
	$pagesTable = pagesTable($label, $slice, $device);

	// TODO - make this more flexible
	$hCC = array(); // hash key is the CC *VALUE*
	$aVars = array("PageSpeed", "SpeedIndex", "reqTotal", "reqHtml", "reqJS", "reqCSS", "reqImg", "reqGif", "reqJpg", "reqPng", "reqFont", "reqFlash", "reqOther", "bytesTotal", "bytesHtml", "bytesJS", "bytesCSS", "bytesImg", "bytesGif", "bytesJpg", "bytesPng", "bytesFont", "bytesFlash", "bytesOther", "bytesHtmlDoc", "numDomains", "maxDomainReqs", "numRedirects", "numErrors", "numHttps", "numCompressed", "numDomElements", "maxage0");
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
			$denominator = sqrt( (($n*$sumXX) - ($sumX*$sumX)) * (($n*$sumYY) - ($sumY*$sumY)) );
			if ( $denominator ) { // avoid divide by zero errors
				$cc = (($n*$sumXY) - ($sumX*$sumY)) / $denominator;
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
			$hTuples[$var1 . "ccf$iRows"] = $var2;      // "ccf" == Correlation Coefficient Field (db column)
			$hTuples[$var1 . "ccv$iRows"] = $prettyCC;  // "ccv" == Correlation Coefficient Value
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

	// total page & request count so we can do percentages
	$totalPages = doSimpleQuery("select count(*) from $pagesTable where $sliceCond;");
	$totalRequests = doSimpleQuery("select sum(reqTotal) from $pagesTable where $sliceCond;");

	// redirects
	if ( !array_key_exists('perRedirects', $hTuples) || null === $hTuples['perRedirects'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and numRedirects > 0;");
		$hTuples['perRedirects'] = round(100*$num/$totalPages);
	}

	// errors
	if ( !array_key_exists('perErrors', $hTuples) || null === $hTuples['perErrors'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and numErrors > 0;");
		$hTuples['perErrors'] = round(100*$num/$totalPages);
	}

	// flash usage
	if ( !array_key_exists('perFlash', $hTuples) || null === $hTuples['perFlash'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and reqFlash > 0;");
		$hTuples['perFlash'] = round(100*$num/$totalPages);
	}

	// custom fonts
	if ( !array_key_exists('perFonts', $hTuples) || null === $hTuples['perFonts'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and reqFont > 0;");
		$hTuples['perFonts'] = round(100*$num/$totalPages);
	}

	// Google Ajax Libraries	
	if ( !array_key_exists('perGlibs', $hTuples) || null === $hTuples['perGlibs'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and numGlibs > 0;");
		$hTuples['perGlibs'] = round(100*$num/$totalPages);
	}

	// https
	if ( !array_key_exists('perHttps', $hTuples) || null === $hTuples['perHttps'] ) {
		$num = doSimpleQuery("select sum(numHttps) from $pagesTable where $sliceCond;");
		$hTuples['perHttps'] = round(100*$num/$totalRequests);
	}

	// max-age caching - percent of requests in each histogram bin
	if ( !array_key_exists('maxageNull', $hTuples) || null === $hTuples['maxageNull'] ) {
		$row = doRowQuery("select sum(maxageNull) as maxageNull, sum(maxage0) as maxage0, sum(maxage1) as maxage1, sum(maxage30) as maxage30, sum(maxage365) as maxage365, sum(maxageMore) as maxageMore from $pagesTable where $sliceCond;");
		$hTuples['maxageNull'] = round(100 * $row['maxageNull'] /$totalRequests);
		$hTuples['maxage0'] = round(100 * $row['maxage0'] / $totalRequests);
		$hTuples['maxage1'] = round(100 * $row['maxage1'] / $totalRequests);
		$hTuples['maxage30'] = round(100 * $row['maxage30'] / $totalRequests);
		$hTuples['maxage365'] = round(100 * $row['maxage365'] / $totalRequests);
		$hTuples['maxageMore'] = round(100 * $row['maxageMore'] / $totalRequests);
	}

	// gzip
	if ( !array_key_exists('perCompressed', $hTuples) || null === $hTuples['perCompressed'] ) {
		// This could be improved by including compressed fonts, excluding compressed binaries (eg images), and excluding files under 1K.
		$query = "select sum(numCompressed) as compressed, sum(reqHtml) + sum(reqJS) + sum(reqCSS) + sum(reqJson) as candidates from $pagesTable where $sliceCond;";
		$row = doRowQuery($query);
		$hTuples['perCompressed'] = round(100 * $row['compressed'] / $row['candidates']);
	}

	// CDN
	if ( !array_key_exists('perCdn', $hTuples) || null === $hTuples['perCdn'] ) {
		$num = doSimpleQuery("select count(*) from $pagesTable where $sliceCond and cdn is not null;");
		$hTuples['perCdn'] = round(100*$num/$totalPages);
	}

	return $hTuples;
}


// Helper function to fix a crawl's expAge values for all requests.
function updateCrawlExpAge($label) {
	global $gRequestsTable;

	$crawl = getCrawl($label);
	if ( $crawl ) {
		$query = "select requestid, expAge, resp_cache_control, resp_expires, resp_date, startedDateTime from $gRequestsTable where pageid >= {$crawl['minPageid']} and pageid <= {$crawl['maxPageid']};";
		$result = doQuery($query);
		while ($row = mysql_fetch_assoc($result)) {
			$newExpAge = computeRequestExpAge($row['resp_cache_control'], $row['resp_expires'], $row['resp_date'], $row['startedDateTime']);
			if ( $newExpAge != $row['expAge'] ) {
				$cmd = "update $gRequestsTable set expAge = $newExpAge where requestid = {$row['requestid']};";
				doSimpleCommand($cmd);
			}
		}
		mysql_free_result($result);
	}
}


// Helper function to fix a request's expAge value
function computeRequestExpAge($cc, $resp_expires, $resp_date, $startedDateTime) {
	$expAge = 0;

	if ( $cc && 
		 ( FALSE !== stripos($cc, "must-revalidate") || FALSE !== stripos($cc, "no-cache") || FALSE !== stripos($cc, "no-store") ) ) {
		// These directives dictate the response can NOT be cached.
		$expAge = 0;
	}
	else if ( $cc  && FALSE !== ($posMaxage = stripos($cc, "max-age=")) ) {
		$expAge = intval(substr($cc, $posMaxage+8));
	}
	else if ( $resp_expires ) {
		// According to RFC 2616 ( http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.2.4 ):
		//     freshness_lifetime = expires_value - date_value
		// If the Date: response header is present, we use that.
		// Otherwise we fall back to $startedDateTime which is based on the client so might suffer from clock skew.
		$startEpoch = ( $resp_date ? strtotime($resp_date) : $startedDateTime );
		$expAge = strtotime($resp_expires) - $startEpoch;
	}

	return $expAge;
}


// Helper function to fix a crawl's maxage* values.
function updateCrawlMaxage($label) {
	global $gPagesTable;
	$result = doQuery("select pageid from $gPagesTable where label='$label';");
	while ($row = mysql_fetch_assoc($result)) {
		updatePageMaxage($row['pageid']);
	}
	mysql_free_result($result);
}


// Helper function to fix a page's maxage* values.
function updatePageMaxage($pageid) {
	global $gPagesTable, $gRequestsTable;

	$result = doQuery("select expAge from $gRequestsTable where pageid = $pageid;");

	$maxageNull = $maxage0 = $maxage1 = $maxage30 = $maxage365 = $maxageMore = 0;
	while ($row = mysql_fetch_assoc($result)) {
		// count expiration windows
		$expAge = $row['expAge'];
		$daySecs = 24*60*60;
		if ( NULL === $expAge ) {
			$maxageNull++;
		}
		else if ( 0 === intval($expAge) ) {
			$maxage0++;
		}
		else if ( $expAge <= (1 * $daySecs) ) {
			$maxage1++;
		}
		else if ( $expAge <= (30 * $daySecs) ) {
			$maxage30++;
		}
		else if ( $expAge <= (365 * $daySecs) ) {
			$maxage365++;
		}
		else {
			$maxageMore++;
		}
	}
	mysql_free_result($result);

	$cmd = "UPDATE $gPagesTable SET " .
		" maxageNull = $maxageNull" .
		", maxage0 = $maxage0" .
		", maxage1 = $maxage1" .
		", maxage30 = $maxage30" .
		", maxage365 = $maxage365" .
		", maxageMore = $maxageMore" .
		" where pageid = $pageid;";
	doSimpleCommand($cmd);
}

?>
