<?php

require_once("../utils.inc");
require_once("../status.inc");

define("NOT_STARTED", 0);
define("SUBMITTED", 1);
define("SUBMIT_DONE", 2);
define("META_DONE", 3);
define("DONE", 4);

// The status table saves $gErrBase + i to indicate that there is a permanent error happens when the test is in the status i.
$gErrBase = 900;
// The list of tasks for a batch run.
$gNumParse = 5; // the number of parse tasks to fork
$gaTasks = array("submit", "status", "obtain");
for ( $i = 1; $i <= $gNumParse; $i++ ) {
	array_push($gaTasks, "parse" . $i); // dynamically create the desired number of parse tasks
}

$gbRepeatView = false; // Currently you have to MANUALLY change this to true if you want to look at "Repeat View".

// Obtain the tests with specified status code
// $divisor and $modulo let us split the job across multiple processes, 
// eg, you could have 3 processes ($divisor=3) where proc 1 is modulo 0 ($modulo=0), proc 2 is 1 ($modulo=1), and proc 3 is 2 ($modulo=2)
function obtainTestsWithCode($status, $divisor=NULL, $modulo=NULL) {
	global $gStatusTable;

	if ( NULL === $divisor && NULL === $modulo ) {
		// no splitting
		$query = "SELECT * FROM $gStatusTable WHERE status = $status;";
	}
	else if ( NULL === $divisor || NULL === $modulo ) {
		// error - not sure what the caller wanted
		dprint("ERROR: obtainTestsWithCode must be called with BOTH divisor and modulo non-NULL.");
		return NULL;
	}
	else if ( $divisor && ($divisor > $modulo) ) {
		$query = "SELECT * FROM $gStatusTable WHERE status = $status and $modulo = (statusid % $divisor);";
	}
	else {
		// some other error - modulo too high? need to zero-base
		dprint("ERROR: obtainTestsWithCode unknown error.");
		return NULL;
	}

	return doQuery($query);
}


// Evalute if a query returns emptry result
function isEmptyQuery($resource) {
	// Deal with the result from doQuery()
	if ( NULL != $resource ) {
		$num_row = mysql_num_rows($resource);
		if ( $num_row && 0 < $num_row )
			return false;
	}
	return true;
}


// Fetch file and retry if it fails.
function fetchUrl($fn) {
	$contents = file_get_contents($fn);
	return $contents;
}


// Set status code in status table
function setStatus($statusid, $status) {
	global $gStatusTable;

	$cmd = "UPDATE $gStatusTable SET status = $status, timeOfLastChange = " . time() . " WHERE statusid = $statusid;";
	doSimpleCommand($cmd);
}


// Submit the unfinished tests to WPT
function submitTest(&$record, $status) {
	global $gStatusTable, $gErrBase;
	global $video, $private, $runs, $docComplete, $fvonly, $mv, $wptApiKey, $gbNoScript;

	$wptServer = wptServer();
	$request = $wptServer . 'runtest.php?f=xml&priority=6&url=' . urlencode($record['url']) . 
		"&location={$record['location']}&runs=$runs" .
		( $private ? "&private=1" : "" ) .
		( $video ? "&video=1" : "" ) .
		"&web10=" . ( $docComplete ? "1" : "0" ) .
		"&fvonly=" . ( $fvonly ? "1" : "0" ) .
		( $mv ? "&mv=1" : "" ) .
		( $gbNoScript ? "&noscript=1" : "" ) .
		( $wptApiKey ? "&k=$wptApiKey" : "" );

	$doc = new DOMDocument();
	if ( $doc ) {
		$response = fetchUrl($request);
		if ( strlen($response) ) {
			$doc->loadXML($response);
			$nodes = $doc->getElementsByTagName('statusCode');
			$code = (int)trim($nodes->item(0)->nodeValue);
			$cmd = "UPDATE $gStatusTable SET attempts = attempts + 1"; // increment the attempts counter
			if ( $code == 200 ) {
				// Update status col in status table
				$nodes = $doc->getElementsByTagName('testId');
				$id = trim($nodes->item(0)->nodeValue);
				$statusid = $record['statusid'];
				$cmd .= ", wptid = '$id', wptRetCode = $code WHERE statusid = $statusid;";
				doSimpleCommand($cmd);
				setStatus($statusid, SUBMITTED);
			} 
			else {
				$cmd .= ", wptRetCode = $code WHERE statusid = $record[statusid];";
				doSimpleCommand($cmd);
				$err_status = $gErrBase + $status;
				setStatus($record['statusid'], $err_status);
			}
		}
		unset( $doc );
	}
}


// Submit the batch test to WPT server.
function submitBatch() {
	$unsubmitTests = obtainTestsWithCode(NOT_STARTED);
	if ( !isEmptyQuery($unsubmitTests) ) {
		while ($row = mysql_fetch_assoc($unsubmitTests)) {
			submitTest($row, 0);
		}
	}
}


// Submit the batch test to WPT server.
function resubmitFailures() {
	global $gStatusTable, $gErrBase;
	$cmd = "update $gStatusTable set status=0, wptid='', wptRetCode='', medianRun=0  where status >= $gErrBase;";
	doSimpleCommand($cmd);
}


// Check if the test is done on WPT server.
function checkWPTStatus() {
	// Query the status table to get wpt id list
	global $gStatusTable, $gErrBase;

	$wptServer = wptServer();
	$result = obtainTestsWithCode(SUBMITTED);

	if ( $result ) {
		$nNoResult = 0;
		while ( $row = mysql_fetch_assoc($result) ) {
			$request = $wptServer . "testStatus.php?f=xml&test=" . $row['wptid'];
			$doc = new DOMDocument();
			if ( $doc ) {
				$response = fetchUrl($request);
				if ( strlen($response) ) {
					$doc->loadXML($response);
					$nodes = $doc->getElementsByTagName('statusCode');
					$code = (int)trim($nodes->item(0)->nodeValue);
					unset($doc);

					if ( 200 == $code ) {
						$nNoResult = 0; // reset
						setStatus($row['statusid'], SUBMIT_DONE);
					} 
					elseif ( 400 <= $code ) {
						$nNoResult = 0; // reset
						setStatus($row['statusid'], SUBMITTED + $gErrBase);
					}
					else {
						$nNoResult++;
						if ( $nNoResult > 200 ) {
							// Quick bail:
							// If we've exhausted all the completed results we do NOT want
							// to continue checking EVERY remaining test. So instead we bail
							// after seeing many (50?) incomplete tests.
							break;
						}
					}
				}
			}	
		}
	}
}


// Get the "meta" information about a single URL's WPT results - median run #, Page Speed score, etc.
// This does NOT get the detailed information about the website - each request, etc.
function parseXMLResult($doc, &$result) {
	global $gbRepeatView;

	$result = array();
	$median = $doc->getElementsByTagName('median')->item(0); // This is the block of info representing ALL the data of the "median" run.
	if ( ! $median ) {
		return;
	}
	$pageview = $median->getElementsByTagName( $gbRepeatView ? 'repeatView' : 'firstView' )->item(0); // change this to 'repeatView' for primed cache
	if ( ! $pageview ) {
		return;
	}

	$result['medianRun'] = (int)$pageview->getElementsByTagName('run')->item(0)->nodeValue;
}


// Obtain XML file of the test results
function obtainXMLResults($divisor=NULL, $modulo=NULL) {
	$tests = obtainTestsWithCode(SUBMIT_DONE, $divisor, $modulo);
	if ( !isEmptyQuery($tests) ) {
		while ( $row = mysql_fetch_assoc($tests) ) {
			obtainXMLResult($row['statusid'], $row['wptid']);
		}
	}
}


// Get the "meta" information about a single URL's WPT results - median run #, Page Speed score, etc.
// This does NOT get the detailed information about the website - each request, etc.
function obtainXMLResult($statusid, $wptid) {
	global $gStatusTable, $gErrBase;

	// Fetch the result xml file
	$wptServer = wptServer();
	$doc = new DOMDocument();
	if ( $doc ) {
		$request = $wptServer . "xmlResult.php?test=$wptid";
		$response = fetchUrl($request);

		if ( strlen($response) ) {
			$doc->loadXML($response);
			$nodes = $doc->getElementsByTagName('statusCode');
			$status = (int)trim($nodes->item(0)->nodeValue);
			$runs = (int)$doc->getElementsByTagname('runs')->item(0)->nodeValue;
			// Sanity check
			if ( (200 == $status) && ($runs > 0) ) {
				// Import a website
				$result = array();
				parseXMLResult($doc, $result);
				if ( array_key_exists('medianRun', $result) ) {
					// Record medianRun in status table
					$medianRun = $result['medianRun'];
					// CVSNO - remove this "obtain" step and skip straight to parse? can we get the medianRun somewhere else?
					// CVSNO - remove pagespeed, etc. columns from status table
					$cmd = "UPDATE $gStatusTable SET medianRun = $medianRun WHERE statusid=$statusid;";
					doSimpleCommand($cmd);
					setStatus($statusid, META_DONE); 
				}
				else {
					// There was an error parsing the meta XML result.
					echo "ERROR: couldn't find median page view for wptid $wptid.\n";
					setStatus($statusid, SUBMIT_DONE + $gErrBase);
				}
			} 
			else {
				setStatus($statusid, SUBMIT_DONE + $gErrBase);
			}
		}
	}
}


// Fill the pagestable and requesttable with the info of the median run.
function fillTables($divisor=NULL, $modulo=NULL) {
	global $gErrBase;

	$tests = obtainTestsWithCode(META_DONE, $divisor, $modulo);

	if ( !IsEmptyQuery($tests) ) {
		$totalParsed = 0;
		while ($statusInfo = mysql_fetch_assoc($tests)) {
			t_mark('importWptResults');
			$status = importWptResults($statusInfo);
			t_aggregate('importWptResults');
			setStatus($statusInfo['statusid'], $status);
			$totalParsed++;
			//dprint("parse proc # " . (1+$modulo) . ", statusid = " . $statusInfo['statusid'] . ", total = $totalParsed");
			//t_echoagg();
		}
	}
}


function importWptResults($statusInfo, $bDebug=false) {
	global $gErrBase, $gbRepeatView;

	$wptid = $statusInfo['wptid'];
	$medianRun = $statusInfo['medianRun'];

	$wptServer = wptServer();
	$request = $wptServer . "export.php?test=$wptid&run=$medianRun&cached=" . ( $gbRepeatView ? "1" : "0" ) . "&php=1";
	$response = fetchUrl($request);
	if ( strlen($response) ) {
		if ( ImportHarJson($response, $statusInfo) ) {
			return DONE;
		}
	}

	return (META_DONE + $gErrBase);
}


// Import a specific HAR JSON response.
function importHarJson($json_text, $statusInfo) {
	global $gStatusTable, $gPagesTable, $gRequestsTable;
	if ( !$json_text ) {
		dprint("ERROR($gStatusTable statusid: $statusInfo[statusid]): HAR file read error.");
		return false;
	}
	$HAR = json_decode($json_text);
	if ( NULL == $HAR ) {
		dprint("ERROR($gStatusTable statusid: $statusInfo[statusid]): JSON decode failed");
		return false;
	}
	$log = $HAR->{ 'log' };

	$pages = $log->{ 'pages' };
	$pagecount = count($pages);
	if ( 0 == $pagecount ) {
		dprint("ERROR($gStatusTable statusid: $statusInfo[statusid]):: No pages found");
		return false;
	}
	if ( 1 < $pagecount ) {
		dprint("WARNING($gStatusTable statusid: $statusInfo[statusid]):: Only one page is expected per HAR file. This HAR file has " . count($pages) . " pages. Only the first page will be processed.\n");
	}

	// STEP 1: Create a partial "page" record so we get a pageid.
	t_mark('ImportPage');
	$pageid = importPage($pages[0], $statusInfo);
	t_aggregate('ImportPage');
	if ( $pageid ) {
		$entries = $log->{ 'entries' };
		// STEP 2: Create all the resources & associate them with the pageid.
		$firstUrl = "";
		$firstHtmlUrl = "";
		t_mark('ImportEntries');
		$bEntries = importEntries($entries, $pageid, $firstUrl, $firstHtmlUrl);
		t_aggregate('Importentries');
		if ( false === $bEntries ) {
			dprint("ERROR($gStatusTable statusid: $statusInfo[statusid]): ImportEntries failed. Purging pageid $pageid");
			purgePage($pageid);
		} else {
			// STEP 3: Go back and fill out the rest of the "page" record based on all the resources.
			t_mark('AggregateStats');
			$bAgg = aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $statusInfo);
			t_aggregate('AggregateStats');
			if ( false === $bAgg ) {
				dprint("ERROR($gStatusTable statusid: $statusInfo[statusid]): AggregateStats failed. Purging pageid $pageid");
				purgePage($pageid);
			}
			else {
				return true;
			}
		}
	}
	return false;
}

// Import a website.
// MAJOR ASSUMPTION: THERE'S ONLY ONE PAGE PER HAR FILE!
// (otherwise, harviewer and har_to_pagespeed won't work)
// $page is the JSON from a HAR file for a single page under log->pages[0]
function importPage($page, $statusInfo) {
	global $gPagesTable, $gRequestsTable;
	$archive = $statusInfo['archive'];
	$label = $statusInfo['label'];
	if ( ! $label ) {
		dprint("ERROR: 'label' was null in importPage");
		return null;
	}
	$url = $statusInfo['url'];
	$urlShort = substr($url, 0, 255);

	$now = time();
	$aTuples = array();
	$pageref = $page->{ 'id' };

	// Add all the insert tuples to an array.
	array_push($aTuples, "createDate = $now");
	$startedDateTime = strtotime($page->{ 'startedDateTime' });
	array_push($aTuples, "startedDateTime = $startedDateTime");
	array_push($aTuples, "archive = '" . mysql_real_escape_string($archive) . "'");
	array_push($aTuples, "label = '" . mysql_real_escape_string($label) . "'");
	array_push($aTuples, "url = '" . mysql_real_escape_string($url) . "'");
	array_push($aTuples, "urlShort = '" . mysql_real_escape_string($urlShort) . "'");
	array_push($aTuples, "onLoad = " . $page->{'_docTime'});
	if ( array_key_exists('_TTFB', $page) && $page->{'_TTFB'} ) {
		array_push($aTuples, "TTFB = " . $page->{'_TTFB'});
	}
	array_push($aTuples, "renderStart = " . $page->{'_render'});
	array_push($aTuples, "fullyLoaded = " . $page->{'_fullyLoaded'});
	array_push($aTuples, "visualComplete = " . $page->{'_visualComplete'});
	if ( array_key_exists('_gzip_total', $page) ) {
		array_push($aTuples, "gzipTotal = " . $page->{'_gzip_total'});
		array_push($aTuples, "gzipSavings = " . $page->{'_gzip_savings'});
	}
	// CVSNO - add a wrapper function for this monkey business, use json_decode_assoc_array (or whatever it is)
	if ( array_key_exists('_domElements', $page) && $page->{'_domElements'} ) {
		array_push($aTuples, "numDomElements = " . $page->{'_domElements'});
	}
	if ( array_key_exists('_domContentLoadedEventStart', $page) && $page->{'_domContentLoadedEventStart'} ) {
		array_push($aTuples, "onContentLoaded = " . $page->{'_domContentLoadedEventStart'});
	}
	if ( array_key_exists('_base_page_cdn', $page) && $page->{'_base_page_cdn'} ) {
		array_push($aTuples, "cdn = '" . mysql_real_escape_string($page->{'_base_page_cdn'}) . "'");
	}
	if ( array_key_exists('_SpeedIndex', $page) && $page->{'_SpeedIndex'} ) {
		array_push($aTuples, "SpeedIndex = " . $page->{'_SpeedIndex'});
	}
	if ( array_key_exists('_pageSpeed', $page) && $page->{'_pageSpeed'} ) {
		$pageSpeedObj = $page->{'_pageSpeed'};
		if ( array_key_exists('score', $pageSpeedObj) ) {
			array_push($aTuples, "PageSpeed = " . $pageSpeedObj->{'score'});
		}
	}

	$cmd = "INSERT INTO $gPagesTable SET " . implode(", ", $aTuples) . ";";
	t_mark('importPage: insert into pages');
	$pageid = doLastInsertId($cmd);
	t_aggregate('importPage: insert into pages');

	if ( ! $pageid ) {
		// There was no inserted row. This is likely a duplicate entry error. 
		// We used to REPLACE these records but that is less desirable because
		// it takes longer, creates orphaned rows in the requests table, and 
		// requires more code. There's no conclusion which is better - the initial 
		// one or the one we're doing now. So let's just keep the initial one.
		return null;
	}

	return $pageid;
}


// Import the requests within a website.
function importEntries($entries, $pageid, &$firstUrl, &$firstHtmlUrl) {
	global $gPagesTable, $gRequestsTable;
	global $ghReqHeaders, $ghRespHeaders;
	for ( $i = 0; $i < count($entries); $i++ ) {
		$entry = $entries[$i];
		$aTuples = array();
		array_push($aTuples, "pageid = $pageid");
		$startedDateTime = strtotime($entry->{ 'startedDateTime' }); // we use this below for expAge calculation
		array_push($aTuples, "startedDateTime = $startedDateTime");
		array_push($aTuples, "time = " . $entry->{ 'time' });

		// REQUEST
		$request = $entry->{ 'request' };
		array_push($aTuples, "method = '" . $request->{ 'method' } . "'");
		array_push($aTuples, "reqHttpVersion = '" . $request->{ 'httpVersion' } . "'");
		$url = $request->{ 'url' };
		array_push($aTuples, "url = '" . mysql_real_escape_string($url) . "'");
		$urlShort = substr($url, 0, 255);
		array_push($aTuples, "urlShort = '" . mysql_real_escape_string($urlShort) . "'");
		$reqHeaderSize = $request->{ 'headersSize' };
		if ( $reqHeaderSize && 0 < $reqHeaderSize ) {
			array_push($aTuples, "reqHeaderSize = $reqHeaderSize");
		}
		$reqBodySize = $request->{ 'bodySize' };
		if ( $reqBodySize && 0 < $reqBodySize ) {
			array_push($aTuples, "reqBodySize = $reqBodySize");
		}

		$headers = $request->{ 'headers' };
		$other = "";
		$hHeaders = array();  // Headers can appear multiple times, so we have to concat them all then add them to avoid setting a column twice.
		$cookielen = 0;
		for ( $h = 0; $h < count($headers); $h++ ) {
			$header = $headers[$h];
			$name = $header->{ 'name' };
			$lcname = strtolower($name);
			$value = substr($header->{ 'value' }, 0, 255);
			$origValue = $header->{ 'value' };
			if ( array_key_exists($lcname, $ghReqHeaders) ) {
				// This is one of the standard headers we want to save.
				$column = $ghReqHeaders[$lcname];
				$hHeaders[$column] = ( array_key_exists($column, $hHeaders) ? $hHeaders[$column] . " $value" : $value );
			}
			else if ( "cookie" == $lcname ) {
				// We don't save the Cookie header, just the size.
				$cookielen += strlen($origValue);
			}
			else {
				// All other headers are lumped together.
				$other .= ( $other ? ", " : "" ) . "$name = $origValue";
			}
		}
		if ( $other ) {
			array_push($aTuples, "reqOtherHeaders = '" . mysql_real_escape_string($other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "reqCookieLen = $cookielen");
		}

		// RESPONSE
		$response = $entry->{ 'response' };
		$status = $response->{ 'status' };
		array_push($aTuples, "status = $status");
		array_push($aTuples, "respHttpVersion = '" . $response->{ 'httpVersion' } . "'");
		if ( property_exists($response, 'url') ) {
			array_push($aTuples, "redirectUrl = '" . mysql_real_escape_string($response->{ 'url' }) . "'");
		}
		$respHeaderSize = $response->{ 'headersSize' };
		if ( $respHeaderSize && 0 < $respHeaderSize ) {
			array_push($aTuples, "respHeaderSize = $respHeaderSize");
		}
		$respBodySize = $response->{ 'bodySize' };
		if ( $respBodySize && 0 < $respBodySize ) {
			array_push($aTuples, "respBodySize = $respBodySize");
		}
		$content = $response->{ 'content' };
		array_push($aTuples, "respSize = " . $content->{ 'size' });
		array_push($aTuples, "mimeType = '" . mysql_real_escape_string($content->{ 'mimeType' }) . "'");
	
		$headers = $response->{ 'headers' };
		$other = "";
		$cookielen = 0;
		for ( $h = 0; $h < count($headers); $h++ ) {
			$header = $headers[$h];
			$name = $header->{ 'name' };
			$lcname = strtolower($name);
			$value = substr($header->{ 'value' }, 0, 255);
			$origValue = $header->{ 'value' };
			if ( array_key_exists($lcname, $ghRespHeaders) ) {
				// This is one of the standard headers we want to save.
				$column = $ghRespHeaders[$lcname];
				$hHeaders[$column] = ( array_key_exists($column, $hHeaders) ? $hHeaders[$column] . " $value" : $value );
			}
			else if ( "set-cookie" == $lcname ) {
				// We don't save the Set-Cookie header, just the size.
				$cookielen += strlen($origValue);
			}
			else {
				// All other headers are lumped together.
				$other .= ( $other ? ", " : "" ) . "$name = $origValue";
			}
		}
		if ( $other ) {
			array_push($aTuples, "respOtherHeaders = '" . mysql_real_escape_string($other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "respCookieLen = $cookielen");
		}
		// calculate expAge - number of seconds before resource expires
		$expAge = 0;
		$cc = ( array_key_exists('resp_cache_control', $hHeaders) ? $hHeaders['resp_cache_control'] : null );
		if ( $cc  && FALSE !== stripos($cc, "must-revalidate") && FALSE !== stripos($cc, "no-cache") && FALSE !== stripos($cc, "no-store") ) {
			// These directives dictate the response can NOT be cached.
			$expAge = 0;
		}
		else if ( $cc  && FALSE !== ($posMaxage = stripos($cc, "max-age=")) ) {
			$expAge = intval(substr($hHeaders['resp_cache_control'], $posMaxage+8));
		}
		else if ( array_key_exists('resp_expires', $hHeaders) ) {
			$expAge = strtotime($hHeaders['resp_expires']) - $startedDateTime;
		}
		array_push($aTuples, "expAge = " . ( $expAge < 0 ? 0 : $expAge ));

		// NOW add all the headers from both the request and response.
		$aHeaders = array_keys($hHeaders);
		for ( $h = 0; $h < count($aHeaders); $h++ ) {
			$header = $aHeaders[$h];
			array_push($aTuples, "$header = '" . mysql_real_escape_string($hHeaders[$header]) . "'");
		}

		$bFirstReq = 0;
		$bFirstHtml = 0;
		if ( ! $firstUrl ) {
			if ( (400 <= $status && 599 >= $status) || (12000 <= $status) ) {
				dprint("ERROR($gPagesTable pageid: $pageid): The first request ($url) failed with status $status.");
				return false;
			}
			// This is the first URL found associated with the page - assume it's the base URL.
			$bFirstReq = 1;
			$firstUrl = $url;
		}
		if ( ! $firstHtmlUrl && 200 == $status ) {
			// This is the first URL found associated with the page that's HTML.
			$bFirstHtml = 1;
			$firstHtmlUrl = $url;
		}
		array_push($aTuples, "firstReq = $bFirstReq");
		array_push($aTuples, "firstHtml = $bFirstHtml");

		$cmd = "REPLACE INTO $gRequestsTable SET " . implode(", ", $aTuples) . ";";
		doSimpleCommand($cmd);
	}
}

// Collect all the aggregate stats for a single website.
function aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $statusInfo) {
	global $gPagesTable, $gRequestsTable, $gUrlsTable;

	// CVSNO - move this error checking to the point before this function is called
	if ( ! $firstUrl ) {
		dprint("ERROR($gPagesTable pageid: $pageid): no first URL found.");
		return false;
	}
	if ( ! $firstHtmlUrl ) {
		dprint("ERROR($gPagesTable pageid: $pageid): no first HTML URL found.");
		return false;
	}

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

	$result = doQuery("select mimeType, urlShort, resp_content_type, respSize, expAge, firstHtml, status, resp_content_encoding, req_host from $gRequestsTable where pageid = $pageid;");
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
			dprint("ERROR($gPagesTable pageid: $pageid): No hostname found in URL: $url");
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

	$cmd = "UPDATE $gPagesTable SET reqTotal = $reqTotal, bytesTotal = $bytesTotal" .
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
		", numDomains = $numDomains" .
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
		", wptid = " . "'" . mysql_real_escape_string($statusInfo['wptid']) . "'" . 
		", wptrun = " . $statusInfo['medianRun'] . 
		( $statusInfo['rank'] ? ", rank = " . $statusInfo['rank'] : "" ) .
		" where pageid = $pageid;";
	doSimpleCommand($cmd);

	return true;
}

function countTestsWithCode($status) {
	global $gStatusTable;
	if ( -1 == $status )
		$query = "SELECT COUNT(*) FROM $gStatusTable;";
	else
		$query = "SELECT COUNT(*) FROM $gStatusTable WHERE status=$status;";
	$resource = doQuery($query);
	$record = mysql_fetch_assoc($resource);
	return $record['COUNT(*)'];
}

function countFailedTests() {
	global $gStatusTable, $gErrBase;
	$query = "SELECT COUNT(*) FROM $gStatusTable WHERE status >= $gErrBase;";
	$resource =  doQuery($query);
	$record = mysql_fetch_assoc($resource);
	return $record['COUNT(*)'];
}


function totalNotDone() {
	$loadedUrls = countTestsWithCode(NOT_STARTED);
	$submittedTests = countTestsWithCode(SUBMITTED);
	$completedTests = countTestsWithCode(SUBMIT_DONE);
	$xmlDoneTests = countTestsWithCode(META_DONE);

	$totalNotDone = $loadedUrls + $submittedTests + $completedTests + $xmlDoneTests;

	return $totalNotDone;
}


// Is the run (crawl) with the specified label done?
function runCompleted($label) {
	global $gbMobile;

	// We determine that a run is completed if its stats exist.
	$device = curDevice();

	return ( getStats($label, "All", $device) );
}


// mysqldump filename for a crawl
// $table is either "pages" or "requests"
// $format is "" or "csv"
function dumpfileName($label, $table="", $format="") {
	global $gbMobile;
	$dumpfile = "../downloads/httparchive_" . ( $gbMobile ? "mobile_" : "" ) . str_replace(" ", "_", $label) . 
		( $table ? "_$table" : "" ) . ( $format ? ".$format" : "" );
	return $dumpfile;
}


function reportSummary() {
	global $gErrBase;
	$totalUrls = countTestsWithCode(-1);
	$loadedUrls = countTestsWithCode(NOT_STARTED);
	$submittedTests = countTestsWithCode(SUBMITTED);
	$completedTests = countTestsWithCode(SUBMIT_DONE);
	$xmlDoneTests = countTestsWithCode(META_DONE);
	$successfulTests = countTestsWithCode(DONE);
	$failedTests = countFailedTests();
	$failedSubmission = countTestsWithCode(NOT_STARTED + $gErrBase);
	$failedWPTTesting = countTestsWithCode(SUBMITTED + $gErrBase);
	$failedProcessResult = countTestsWithCode( SUBMIT_DONE + $gErrBase);
	$failedImportHar = countTestsWithCode( META_DONE + $gErrBase);

	$bHtml = array_key_exists("REMOTE_ADDR", $_SERVER);
	$sSummary = "";
	$sSummary .= ( $bHtml ? "<pre>\n" : "" );
	$sSummary .= sprintf("%-20s %10s %15s\n", "", "cumulative", "at this stage");
	$sFormat = "%-20s %10d %15d\n";
	$sSummary .= sprintf($sFormat, "initial URLs", $totalUrls, $loadedUrls);
	$sSummary .= sprintf($sFormat, "submitted", $totalUrls - ($loadedUrls), $submittedTests);
	$sSummary .= sprintf($sFormat, "tested", $totalUrls - ($loadedUrls + $submittedTests), $completedTests);
	$sSummary .= sprintf($sFormat, "obtained", $totalUrls - ($loadedUrls + $submittedTests + $completedTests), $xmlDoneTests);
	$sSummary .= sprintf($sFormat, "HAR parsed", $totalUrls - ($loadedUrls + $submittedTests + $completedTests + $xmlDoneTests), 0);
	$sSummary .= sprintf("\n");
	$sSummary .= sprintf("DONE:    %10d    %s\n", $successfulTests + $failedTests, date("H:i M j"));
	$sSummary .= sprintf("success: %10d\n", $successfulTests);
	$sSummary .= sprintf("failed:  %10d (%d%%)\n", $failedTests, ($successfulTests + $failedTests) ? round(100*$failedTests/($successfulTests + $failedTests)) : 0 );
	$sSummary .= sprintf("         %10d - submission failed\n", $failedSubmission);
	$sSummary .= sprintf("         %10d - WPT test failed\n", $failedWPTTesting);
	$sSummary .= sprintf("         %10d - test result processing failed\n", $failedProcessResult);
	$sSummary .= sprintf("         %10d - HAR import failed\n", $failedImportHar);
	$sSummary .= ( $bHtml ? "</pre>\n" : "" );

	return $sSummary;
}


function t_mark($name) {
	global $gMarks;
	$gMarks[$name] = time();
}

function t_measure($name) {
	global $gMarks;
	return ( array_key_exists($name, $gMarks) ? time() - $gMarks[$name] : 0 );
}

function t_aggregate($name) {
	global $gAggTimes, $gAggCounts;

	$delta = t_measure($name);
	if ( ! array_key_exists($name, $gAggTimes) ) {
		$gAggTimes[$name] = 0;
		$gAggCounts[$name] = 0;
	}

	$gAggTimes[$name] += $delta;
	$gAggCounts[$name]++;
}

function t_echo($name) {
	dprint("$name: " . t_measure($name));
}

function t_echoagg() {
	global $gAggTimes, $gAggCounts;

	foreach(array_keys($gAggTimes) as $key) {
		dprint("$key: total=" . $gAggTimes[$key] . ", avg=" . round($gAggTimes[$key]/$gAggCounts[$key]));
	}
}

// Parse out the pithy mime type from the long HTTP response header.
// This is surprisingly accurate. I spent an hour grepping through the distinct resp_content_types
// from a single run (Oct 15 2012) and the mistakes were very small - < 0.00001% off.
function prettyMimetype($mimeType, $url) {
	$mimeType = strtolower($mimeType);

	// do most unique first
	foreach(array("flash", "font", "css", "image", "script", "html") as $type) {
		if ( false !== strpos($mimeType, $type) ) {
			return $type;
		}
	}

	// some fonts don't have "font" in their mimeType (25% as of 12/2012)
	if ( preg_match('/.*\.eot/', $url) || preg_match('/.*\.eot\?/', $url) ||
		 preg_match('/.*\.ttf/', $url) || preg_match('/.*\.ttf\?/', $url) ||
		 preg_match('/.*\.woff/', $url) || preg_match('/.*\.woff\?/', $url) ||
		 preg_match('/.*\.otf/', $url) || preg_match('/.*\.otf\?/', $url) ) {
		return "font";
	}

	return "other";
}

function lockFilename($device, $proc="uber") { // CVSNO - go back and remove $device from all callers
	// The file used as a file lock to coordinate the interaction of processes.
	$lockFile = "./httparchive_batch_lock_{$proc}.txt";
	return $lockFile;
}


function killProcessAndChildren($pid, $signal=9) { 
	exec("ps -ef | awk '\$3 == '$pid' { print  \$2 }'", $output, $ret); 
	if ( $ret ) {
		return 'you need ps, grep, and awk'; 
	}

	while ( list(, $t) = each($output) ) { 
		if ( $t != $pid ) { 
			killProcessAndChildren($t,$signal); 
		} 
	} 

	posix_kill($pid, $signal); 
}


function getPid($text) {
	exec("ps -ef | grep '$text' | grep -v 'grep $text' | awk '{ print \$2 }'", $output, $ret);
	if ( $ret ) {
		return -1;
	}
	else {
		if ( count($output) ) {
			return $output[0];
		}
		else {
			return 0;
		}
	}
}

?>
