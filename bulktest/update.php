<?php
/* This file is used to coordinate multiple updates for the schema
   changes in Dec 2012.
*/

require_once("../settings.inc");
require_once("../utils.inc");
require_once("../dbapi.inc");
require_once("../resources.inc");
require_once("batch_lib.inc");

// Even tho we run this from DEV we want to take action on the production tables.
if ( $gbDev ) {
	$gbDev = false;
	$gRequestsTable = "requests";
	$gPagesTable = "pages";
	$gStatsTable = "stats";
}
$pagesTable = $gPagesTable;
$requestsTable = $gRequestsTable;


$device = ( $gbMobile ? "iphone" : "IE8" );

$label = $dumpfile = null;
if ( array_key_exists(1, $argv) ) {
	$label = $argv[1];
}
if ( array_key_exists(2, $argv) ) {
	$dumpfile = $argv[2];
}
if ( ! $label ) {
	tprint("ERROR: you must specify the label, eg, \"Nov 15 2012\".");
	exit();
}

$crawl = getCrawl($label, "All", $device);
if ( FALSE === $crawl ) {
	tprint("ERROR: Crawl \"$label\" for archive \"All\" and location \"$device\" wasn't found.");
}

$minPageid = $crawl['minPageid'];
$maxPageid = $crawl['maxPageid'];
$pageidCond = "pageid >= $minPageid and pageid <= $maxPageid";


// 1. RESTORE DUMP FILE?
tprint("\n1. Checking if dumpfile needs to be restored...");
if ( ! resourcesAvailableFromTable($minPageid) || ! resourcesAvailableFromTable($maxPageid) ) {
	if ( ! $dumpfile ) {
		tprint("ERROR: Need to specify dump file to restore requests.");
		exit();
	}
	else {
		tprint("Restoring dump file \"$dumpfile\"...");
		tprint("CVSNO - ADD THIS CODE!!!");
		// restore redirectUrlShort column!
		exit();
	}
}
tprint("...don't need to restore dumpfile - requests exist in $requestsTable table.");



// 2. REMOVE ORPHANED REQUESTS
tprint("\n2.Checking for orphaned records...");
$ppages = doSimpleQuery("select count(distinct(pageid)) from $pagesTable where $pageidCond;");
$rpages = doSimpleQuery("select count(distinct(pageid)) from $requestsTable where $pageidCond;");
if ( $ppages < $rpages ) {
	$delta = $rpages - $ppages;
	tprint("There are $delta orphaned records. Run the following command:\n" .
		   "    delete from $requestsTable where $pageidCond and pageid not in (select pageid from $pagesTable where $pageidCond);\n" .
		   "aborting");
	exit();
}
tprint("...no orphaned records.");



// 3. Calculate requests' expAge
tprint("\n3. Checking if expAge needs calculating...");
$numExpage = doSimpleQuery("select count(*) from $requestsTable where $pageidCond and expAge != 0;");
if ( $numExpage < round( ($maxPageid - $minPageid) * 0.2 ) ) {
	tprint("Only $numExpage record(s) have expAge calculated so we're going to recalculate for all of them.");
	$query = "select requestid, resp_cache_control, resp_expires, startedDateTime from $requestsTable where $pageidCond and (resp_cache_control like '%max-age=%' or resp_expires is not null);";
	tprint("  doing query: $query");
	$result = doQuery($query);
	tprint("  done with query");
	$iExpage = 0;
	while ($row = mysql_fetch_assoc($result)) {
		$iExpage++;
		$requestid = $row['requestid'];
		$cc = $row['resp_cache_control'];
		$exp = $row['resp_expires'];
		$startedDateTime = $row['startedDateTime'];
		$verbose = false;

		$expAge = 0;
		if ( $cc  && FALSE !== stripos($cc, "must-revalidate") && FALSE !== stripos($cc, "no-cache") && FALSE !== stripos($cc, "no-store") ) {
			// These directives dictate the response can NOT be cached.
			$expAge = 0;
		}
		else if ( $cc  && FALSE !== ($posMaxage = stripos($cc, "max-age=")) ) {
			$expAge = intval(substr($cc, $posMaxage+8));
		}
		else if ( $exp ) {
			// minimal validation on the Expires header
			$exp3 = strtolower(substr($exp, 0, 3));
			if ( "sun" === $exp3 || "mon" === $exp3 || "tue" === $exp3 || "wed" === $exp3 || "thu" === $exp3 || "fri" === $exp3 || "sat" === $exp3 ) {
				$expAge = strtotime($exp) - $startedDateTime;
				//dprint("CVSNO: $requestid: expires: expAge = $expAge, strtotime = " . strtotime($exp) . " for $exp");
				//$verbose = true;
			}
		}

		if ( $expAge < 0 ) {
			$expAge = 0;
		}

		if ( $expAge ) {
			if ( $verbose ) {
				//dprint("CVSNO: $requestid: expAge = $expAge, cc = $cc, exp = $exp, sdt = $startedDateTime");
			}
			$cmd = "update $requestsTable set expAge = $expAge where requestid = $requestid;";
			doSimpleCommand($cmd);
		}

		if ( 0 === ($iExpage % 100000) ) {
			tprint("    finished " . ($iExpage/1000) . "K");
		}
	}
	mysql_free_result($result);
}
tprint("...done checking expAge.");



// 4. Update new fields in pages (based on requests & WPT HAR).
tprint("\n4. Update new pages fields...");
$query = "select pageid from $pagesTable where $pageidCond and maxDomainReqs = 0;";
//$query = "select pageid from $pagesTable where $pageidCond and maxDomainReqs = 0 limit 10;"; // CVSNO
$result = doQuery($query);
$iPages = 0;
while ($row = mysql_fetch_assoc($result)) {
	$pageid = $row['pageid'];
	importPageMod($pageid);
	$iPages++;
	if ( 0 === ( $iPages % 10000 ) ) {
		tprint("    finished " . ($iPages/1000) . "K");
	}
}
tprint("...done updating new pages fields.");
/*
 importPage: TTFB
 importPage: numDomElements
 importPage: fullyLoaded
 importPage: cdn
 importPage: SpeedIndex
 importPage: visualComplete
 importPage: gzipTotal
 importPage: gzipSavings

 aggStats: reqGif
 aggStats: reqJpg
 aggStats: reqPng
 aggStats: reqFont
 aggStats: bytesGif
 aggStats: bytesJpg
 aggStats: bytesPng
 aggStats: bytesFont
 aggStats: maxageNull
 aggStats: maxage0
 aggStats: maxage1
 aggStats: maxage30
 aggStats: maxage365
 aggStats: maxageMore
 aggStats: numCompressed
 aggStats: numHttps
 aggStats: numGlibs
 aggStats: numErrors
 aggStats: numRedirects
 aggStats: maxDomainReqs
 aggStats: bytesHtmlDoc
*/
tprint("DONE!");


exit();

/*
new fields in pages
recalc stats
REMOVE redirectUrlShort!!!
mysqldump
*/

function tprint($msg) {
	echo date("H:i:s") . " $msg\n";
}


// shortened version from batch_lib.inc
// $page
function importPageMod($pageid) {
	global $pagesTable, $requestsTable;

	$query = "select wptid, wptrun from $pagesTable where pageid = $pageid;";
	$row = doRowQuery($query);
	if ( ! $row ) {
		tprint("ERROR: importPageMod($pageid): failed to find row: $query");
		return;
	}

	// lifted from importWptResults
	$wptid = $row['wptid'];
	$medianRun = $row['wptrun'];
	if ( ! $wptid || ! $medianRun ) {
		tprint("ERROR: importPageMod($pageid): failed to find wptid and wptrun: $wptid, $medianRun");
		return;
	}
	$wptServer = wptServer();
	$request = $wptServer . "export.php?test=$wptid&run=$medianRun&cached=0&php=1";
	$response = fetchUrl($request);
	if ( ! strlen($response) ) {
		tpring("ERROR: importPageMod($pageid): URL failed: $request");
		return;
	}

	// lifted from importHarJson
	$json_text = $response;
	$HAR = json_decode($json_text);
	if ( NULL == $HAR ) {
		tprint("ERROR: importPageMod($pageid): JSON decode failed");
		return;
	}
	$log = $HAR->{ 'log' };
	$pages = $log->{ 'pages' };
	$pagecount = count($pages);
	if ( 0 == $pagecount ) {
		tprint("ERROR: importPageMod($pageid): No pages found");
		return;
	}

	// lifted from importPage
	$page = $pages[0];
	$aTuples = array();

	// Add all the insert tuples to an array.
	if ( $page->{'_TTFB'} ) {
		array_push($aTuples, "TTFB = " . $page->{'_TTFB'});
	}
	array_push($aTuples, "fullyLoaded = " . $page->{'_fullyLoaded'});
	array_push($aTuples, "visualComplete = " . $page->{'_visualComplete'});
	if ( $page->{'_gzip_total'} ) {
		array_push($aTuples, "gzipTotal = " . $page->{'_gzip_total'});
		array_push($aTuples, "gzipSavings = " . $page->{'_gzip_savings'});
	}
	if ( $page->{'_domElements'} ) {
		array_push($aTuples, "numDomElements = " . $page->{'_domElements'});
	}
	if ( $page->{'_domContentLoadedEventStart'} ) {
		array_push($aTuples, "onContentLoaded = " . $page->{'_domContentLoadedEventStart'});
	}
	if ( $page->{'_base_page_cdn'} ) {
		array_push($aTuples, "cdn = '" . mysql_real_escape_string($page->{'_base_page_cdn'}) . "'");
	}
	if ( $page->{'_SpeedIndex'} ) {
		array_push($aTuples, "SpeedIndex = " . $page->{'_SpeedIndex'});
	}


	// lifted from aggregateStats
	// initialize variables for counting the page's stats
	$bytesTotal = 0;
	$reqTotal = 0;
	$hSize = array();
	$hCount = array();
	foreach(array("flash", "css", "image", "script", "html", "font", "other", "gif", "jpg", "png") as $type) {
		// initialize the hashes
		$hSize[$type] = 0;
		$hCount[$type] = 0;
	}
	$hDomains = array();
	$maxageNull = $maxage0 = $maxage1 = $maxage30 = $maxage365 = $maxageMore = 0;
	$bytesHtmlDoc = $numRedirects = $numErrors = $numGlibs = $numHttps = $numCompressed = $maxDomainReqs = 0;

	$result = doQuery("select mimeType, urlShort, resp_content_type, respSize, expAge, firstHtml, status, resp_content_encoding, req_host from $requestsTable where pageid = $pageid;");
	while ($row = mysql_fetch_assoc($result)) {
		$url = $row['urlShort'];
		$mimeType = prettyMimetype($row['mimeType'], $url);
		$respSize = intval($row['respSize']);
		$reqTotal++;
		$bytesTotal += $respSize;
		$hCount[$mimeType]++;
		$hSize[$mimeType] += $respSize;

		if ( "image" === $mimeType ) {
			$content_type = $row['resp_content_type'];
			$imgformat = ( false !== stripos($content_type, "image/gif") ? "gif" : 
						   ( false !== stripos($content_type, "image/jpg") || false !== stripos($content_type, "image/jpeg") ? "jpg" : 
							 ( false !== stripos($content_type, "image/png") ? "png" : "" ) ) );
			if ( $imgformat ) {
				$hCount[$imgformat]++;
				$hSize[$imgformat] += $respSize;
			}
		}

		// count unique domains (really hostnames)
		$aMatches = array();
		if ( $url && preg_match('/http[s]*:\/\/([^\/]*)/', $url, $aMatches) ) {
			$hostname = $aMatches[1];
			if ( ! array_key_exists($hostname, $hDomains) ) {
				$hDomains[$hostname] = 0;
			}
			$hDomains[$hostname]++; // count hostnames
		}
		else {
			tprint("ERROR: importPageMod($pageid): No hostname found in URL: $url");
		}

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

		if ( $row['firstHtml'] ) {
			$bytesHtmlDoc = $respSize;  // CVSNO - can we get this UNgzipped?!
		}

		$status = $row['status'];
		if ( 300 <= $status && $status < 400 && 304 != $status ) {
			$numRedirects++;
		}
		else if ( 400 <= $status && $status < 600 ) {
			$numErrors++;
		}

		if ( 0 === stripos($url, "https://") ) {
			$numHttps++;
		}

		if ( FALSE !== stripos($row['req_host'], "googleapis.com") ) {
			$numGlibs++;
		}

		if ( "gzip" == $row['resp_content_encoding'] || "deflate" == $row['resp_content_encoding'] ) {
			$numCompressed++;
		}
	}
	mysql_free_result($result);
	$numDomains = count(array_keys($hDomains));
	foreach (array_keys($hDomains) as $domain) {
		$maxDomainReqs = max($maxDomainReqs, $hDomains[$domain]);
	}

	$cmd = "UPDATE $pagesTable SET reqTotal = $reqTotal, bytesTotal = $bytesTotal" .
		", " . implode(", ", $aTuples) . 
		", reqHtml = " . $hCount['html'] . ", bytesHtml = " . $hSize['html'] .
		", reqJS = " . $hCount['script'] . ", bytesJS = " . $hSize['script'] .
		", reqCSS = " . $hCount['css'] . ", bytesCSS = " . $hSize['css'] .
		", reqImg = " . $hCount['image'] . ", bytesImg = " . $hSize['image'] .
		", reqGif = " . $hCount['gif'] . ", bytesGif = " . $hSize['gif'] .
		", reqJpg = " . $hCount['jpg'] . ", bytesJpg = " . $hSize['jpg'] .
		", reqPng = " . $hCount['png'] . ", bytesPng = " . $hSize['png'] .
		", reqFlash = " . $hCount['flash'] . ", bytesFlash = " . $hSize['flash'] .
		", reqFont = " . $hCount['font'] . ", bytesFont = " . $hSize['font'] .
		", reqOther = " . $hCount['other'] . ", bytesOther = " . $hSize['other'] .
		", maxageNull = $maxageNull" .
		", maxage0 = $maxage0" .
		", maxage1 = $maxage1" .
		", maxage30 = $maxage30" .
		", maxage365 = $maxage365" .
		", maxageMore = $maxageMore" .
		( $bytesHtmlDoc ? ", bytesHtmlDoc = $bytesHtmlDoc" : "" ) .
		", numRedirects = $numRedirects" .
		", numErrors = $numErrors" .
		", numGlibs = $numGlibs" .
		", numHttps = $numHttps" .
		", numCompressed = $numCompressed" .
		", maxDomainReqs = $maxDomainReqs" .
		" where pageid = $pageid;";
	//tprint("$cmd");
	doSimpleCommand($cmd);
}


?>
