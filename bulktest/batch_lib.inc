<?php

require_once("../utils.inc");

define("NOT_STARTED", 0);
define("SUBMITTED", 1);
define("SUBMIT_DONE", 2);
define("META_DONE", 3);
define("DONE", 4);

// The status table saves $gErrBase + i to indicate that there is a permanent error happens when the test is in the status i.
$gErrBase = 900;


// Obtain the tests with specified status code
// $divisor and $modulo let us split the job across multiple processes, 
// eg, you could have 3 processes where proc 1 is modulo 1, proc 2 is 2, and proc 3 is 0
function obtainTestsWithCode($status, $divisor=NULL, $modulo=NULL) {
	global $gStatusTable;

	if ( $divisor && ($divisor > $modulo) ) {
		$query = "SELECT * FROM $gStatusTable WHERE status = $status and $modulo = (statusid % $divisor);";
	}
	else {
		$query = "SELECT * FROM $gStatusTable WHERE status = $status;";
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
	global $video, $private, $runs, $docComplete, $fvonly, $mv, $wptApiKey;

	$wptServer = wptServer();
	$request = $wptServer . 'runtest.php?f=xml&priority=6&url=' . urlencode($record['url']) . 
		"&location={$record['location']}&runs=$runs" .
		( $private ? "&private=1" : "" ) .
		( $video ? "&video=1" : "" ) .
		( $docComplete ? "&web10=1" : "" ) .
		( $fvonly ? "&fvonly=1" : "" ) .
		( $mv ? "&mv=1" : "" ) .
		( $wptApiKey ? "&k=$wptApiKey" : "" );

	$doc = new DOMDocument();
	if ( $doc ) {
		$response = fetchUrl($request);
		if ( strlen($response) ) {
			$doc->loadXML($response);
			$nodes = $doc->getElementsByTagName('statusCode');
			$code = (int)trim($nodes->item(0)->nodeValue);
			if ( $code == 200 ) {
				// Update status col in status table
				$nodes = $doc->getElementsByTagName('testId');
				$id = trim($nodes->item(0)->nodeValue);
				$statusid = $record['statusid'];
				$cmd = "UPDATE $gStatusTable SET wptid = '$id', wptRetCode = $code WHERE statusid = $statusid;";
				doSimpleCommand($cmd);
				setStatus($statusid, SUBMITTED);
			} 
			else {
				$cmd = "UPDATE $gStatusTable SET wptRetCode = $code WHERE statusid = $record[statusid];";
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
						setStatus($row['statusid'], SUBMIT_DONE);
					} 
					elseif ( 400 <= $code ) {
						setStatus($row['statusid'], SUBMITTED + $gErrBase);
					}
					else {
						$nNoResult++;
						if ( $nNoResult > 50 ) {
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


function parseXMLResult($doc, &$result) {
	$runs = $doc->getElementsByTagName('run');
	$result = array();
	$median = $doc->getElementsByTagName('median')->item(0);
	$result['medianRun'] = (int)$median->getElementsByTagName('run')->item(0)->nodeValue;
	$result['result'] = (int)$median->getElementsByTagName('result')->item(0)->nodeValue;
	$result['loadTime'] = (int)$median->getElementsByTagName('docTime')->item(0)->nodeValue;
	$result['startRender'] = (int)$median->getElementsByTagName('render')->item(0)->nodeValue;
	// PageSpeed Score
	if ( $median->getElementsByTagName('PageSpeedScore') ) {
		$result['pagespeedScore'] = (int)$median->getElementsByTagName('PageSpeedScore')->item(0)->nodeValue;
	}
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


function obtainXMLResult($statusid, $wptid) {
	global $gStatusTable, $gErrBase;

	// Fetch the result xml file
	$wptServer = wptServer();
	$doc = new DOMDocument();
	if ( $doc ) {
		$request = $wptServer . "xmlResult.php?test=$wptid&pagespeed=1";
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
				// Record medianRun in status table
				$medianRun = $result['medianRun'];
				$startRender = $result['startRender'];
				$pagespeedScore = $result['pagespeedScore'];
				$cmd = "UPDATE $gStatusTable SET medianRun=$medianRun, startRender=$startRender, pagespeedScore=$pagespeedScore WHERE statusid=$statusid;";
				doSimpleCommand($cmd);
				setStatus($statusid, META_DONE); 
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
		while ($statusInfo = mysql_fetch_assoc($tests)) {
			$status = importWptResults($statusInfo);
			setStatus($statusInfo['statusid'], $status);
		}
	}
}


function importWptResults($statusInfo, $bDebug=false) {
	global $gErrBase;

	$wptid = $statusInfo['wptid'];
	$medianRun = $statusInfo['medianRun'];

	$wptServer = wptServer();
	$request = $wptServer . "export.php?test=$wptid&run=$medianRun&cached=0&php=1";
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
	if ( $pageid ) {
		$entries = $log->{ 'entries' };
		// STEP 2: Create all the resources & associate them with the pageid.
		$firstUrl = "";
		$firstHtmlUrl = "";
		t_mark('ImportEntries');
		$bEntries = importEntries($entries, $pageid, $firstUrl, $firstHtmlUrl);
		if ( false === $bEntries ) {
			dprint("ERROR($gStatusTable statusid: $statusInfo[statusid]): ImportEntries failed. Purging pageid $pageid");
			purgePage($pageid);
		} else {
			// STEP 3: Go back and fill out the rest of the "page" record based on all the resources.
			t_mark('AggregateStats');
			$url = aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $statusInfo);
			t_aggregate('AggregateStats');
			if ( false === $url ) {
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
function importPage($page, $statusInfo) {
	global $gPagesTable, $gRequestsTable;
	$archive = $statusInfo['archive'];
	$label = $statusInfo['label'];

	$now = time();
	$aTuples = array();
	$pageref = $page->{ 'id' };

	// Add all the insert tuples to an array.
	array_push($aTuples, "createDate = $now");
	$startedDateTime = strtotime($page->{ 'startedDateTime' });
	array_push($aTuples, "startedDateTime = $startedDateTime");
	array_push($aTuples, "archive = '" . mysql_real_escape_string($archive) . "'");
	if ( $label ) {
		array_push($aTuples, "label = '" . mysql_real_escape_string($label) . "'");
	}
	$title = mysql_real_escape_string($page->{ 'title' });
	array_push($aTuples, "title = '$title'");

	$pageTimings = $page->{ 'pageTimings' };

	$onContentLoaded = $pageTimings->{ 'onContentLoad' };
	if ( $onContentLoaded && 0 < $onContentLoaded ) {
		array_push($aTuples, "onContentLoaded = $onContentLoaded");
	}
	$onLoad = $pageTimings->{ 'onLoad' };
	if ( $onLoad && 0 < $onLoad ) {
		array_push($aTuples, "onLoad = $onLoad");
	}

	$cmd = "REPLACE INTO $gPagesTable SET " . implode(", ", $aTuples) . ";";
	doSimpleCommand($cmd);

	// get the pageid
	$cmd = "SELECT pageid FROM $gPagesTable WHERE startedDateTime=$startedDateTime AND createDate='$now' AND title='" . 
		mysql_real_escape_string($title) . "';";
	$pageid = doSimpleQuery($cmd);

	return $pageid;
}

// Import the requests within a website.
function importEntries($entries, $pageid, &$firstUrl, &$firstHtmlUrl) {
	global $gPagesTable, $gRequestsTable;
	global $ghReqHeaders, $ghRespHeaders;
	global $ghReqOtherHeaders, $ghRespOtherHeaders;
	for ( $i = 0; $i < count($entries); $i++ ) {
		$entry = $entries[$i];
		$aTuples = array();
		array_push($aTuples, "pageid = $pageid");
		array_push($aTuples, "startedDateTime = " . strtotime($entry->{ 'startedDateTime' }));
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
			if ( array_key_exists($lcname, $ghReqHeaders) ) {
				$column = $ghReqHeaders[$lcname];
				$hHeaders[$column] = ( array_key_exists($column, $hHeaders) ? $hHeaders[$column] . " $value" : $value );
			}
			else if ( "cookie" == $lcname ) {
				$cookielen += strlen($value);
			}
			else {
				$other .= ( $other ? ", " : "" ) . "$name = $value";
				$ghReqOtherHeaders[$name] = ( array_key_exists($name, $ghReqOtherHeaders) ? $ghReqOtherHeaders[$name]+1 : 1 );
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
			array_push($aTuples, "redirectUrlShort = '" . mysql_real_escape_string(substr($response->{ 'url' }, 0, 255)) . "'");
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
			if ( array_key_exists($lcname, $ghRespHeaders) ) {
				$column = $ghRespHeaders[$lcname];
				$hHeaders[$column] = ( array_key_exists($column, $hHeaders) ? $hHeaders[$column] . " $value" : $value );
			}
			else if ( "set-cookie" == $lcname ) {
				$cookielen += strlen($value);
			}
			else {
				$other .= ( $other ? ", " : "" ) . "$name = $value";
				$ghRespOtherHeaders[$name] = ( array_key_exists($name, $ghRespOtherHeaders) ? $ghRespOtherHeaders[$name]+1 : 1 );
			}
		}
		if ( $other ) {
			array_push($aTuples, "respOtherHeaders = '" . mysql_real_escape_string($other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "respCookieLen = $cookielen");
		}

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

	$bytesTotal = 0;
	$reqTotal = 0;
	$hSize = array();
	$hCount = array();
	foreach(array("flash", "css", "image", "script", "html", "other") as $type) {
		// initialize the hashes
		$hSize[$type] = 0;
		$hCount[$type] = 0;
	}
	$hDomains = array();

	$result = doQuery("select mimeType, urlShort, respSize from $gRequestsTable where pageid = $pageid;");
	while ($row = mysql_fetch_assoc($result)) {
		$mimeType = prettyMimetype($row['mimeType']);
		$respSize = intval($row['respSize']);
		$reqTotal++;
		$bytesTotal += $respSize;
		$hCount[$mimeType]++;
		$hSize[$mimeType] += $respSize;

		// count unique domains (really hostnames)
		$url = $row['urlShort'];
		$aMatches = array();
		if ( $url && preg_match('/http[s]*:\/\/([^\/]*)/', $url, $aMatches) ) {
			$hostname = $aMatches[1];
			$hDomains[$hostname] = 1; // don't need to count, just find unique domains
		}
		else {
			dprint("ERROR($gPagesTable pageid: $pageid): No hostname found in URL: $url");
		}
	}
	mysql_free_result($result);
	$numDomains = count(array_keys($hDomains));

	$url = $firstUrl;
	$urlShort = substr($url, 0, 255);

	$urlHtml = $firstHtmlUrl;
	$urlHtmlShort = substr($urlHtml, 0, 255);

	$cmd = "UPDATE $gPagesTable SET url = " . "'" . mysql_real_escape_string($url) . "'" .
		", urlShort = " . "'" . mysql_real_escape_string($urlShort) . "'" .
		", urlHtml = " . "'" . mysql_real_escape_string($urlHtml) . "'" .
		", urlHtmlShort = " . "'" . mysql_real_escape_string($urlHtmlShort) . "'" .
		", reqTotal = $reqTotal, bytesTotal = $bytesTotal" .
		", reqHtml = " . $hCount['html'] . ", bytesHtml = " . $hSize['html'] .
		", reqJS = " . $hCount['script'] . ", bytesJS = " . $hSize['script'] .
		", reqCSS = " . $hCount['css'] . ", bytesCSS = " . $hSize['css'] .
		", reqImg = " . $hCount['image'] . ", bytesImg = " . $hSize['image'] .
		", reqFlash = " . $hCount['flash'] . ", bytesFlash = " . $hSize['flash'] .
		", reqOther = " . $hCount['other'] . ", bytesOther = " . $hSize['other'] .
		", numDomains = $numDomains" .
		", wptid = " . "'" . mysql_real_escape_string($statusInfo['wptid']) . "'" . 
		", wptrun = " . $statusInfo['medianRun'] . 
		", renderStart = " . $statusInfo['startRender'] . 
		", PageSpeed = " . $statusInfo['pagespeedScore'] .
		( $statusInfo['rank'] ? ", rank = " . $statusInfo['rank'] : "" ) .
		" where pageid = $pageid;";
	doSimpleCommand($cmd);

	return $url;
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
	echo ( $bHtml ? "<pre>\n" : "" );
	printf("%-20s %10s %15s\n", "", "cumulative", "at this stage");
	$sFormat = "%-20s %10d %15d\n";
	printf($sFormat, "initial URLs", $totalUrls, $loadedUrls);
	printf($sFormat, "submitted", $totalUrls - ($loadedUrls), $submittedTests);
	printf($sFormat, "tested", $totalUrls - ($loadedUrls + $submittedTests), $completedTests);
	printf($sFormat, "obtained", $totalUrls - ($loadedUrls + $submittedTests + $completedTests), $xmlDoneTests);
	printf($sFormat, "HAR parsed", $totalUrls - ($loadedUrls + $submittedTests + $completedTests + $xmlDoneTests), 0);
	printf("\n");
	printf("DONE:    %10d    %s\n", $successfulTests + $failedTests, date("H:i M j"));
	printf("success: %10d\n", $successfulTests);
	printf("failed:  %10d (%d%%)\n", $failedTests, 100*$failedTests/$successfulTests);
	printf("         %10d - submission failed\n", $failedSubmission);
	printf("         %10d - WPT test failed\n", $failedWPTTesting);
	printf("         %10d - test result processing failed\n", $failedProcessResult);
	printf("         %10d - HAR import failed\n", $failedImportHar);
	echo ( $bHtml ? "</pre>\n" : "" );

	$total_in_processing = $loadedUrls + $submittedTests + $completedTests;
	return $total_in_processing;
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
	echo "$name: " . t_measure($name) . "\n";
}

function t_echoagg() {
	global $gAggTimes, $gAggCounts;

	foreach(array_keys($gAggTimes) as $key) {
		echo "$key: total=" . $gAggTimes[$key] . ", avg=" . round($gAggTimes[$key]/$gAggCounts[$key]) . "\n";
	}
}

// Parse out the pithy mime type from the long HTTP response header.
function prettyMimetype($mimeType) {
	$mimeType = strtolower($mimeType);

	// do most unique first
	foreach(array("flash", "css", "image", "script", "html") as $type) {
		if ( false !== strpos($mimeType, $type) ) {
			return $type;
		}
	}

	return "other";
}

function lockFilename($device, $proc="uber") {
	// The file used as a file lock to coordinate the interaction of processes.
	$lockFile = "/tmp/httparchive_batch_lock_{$device}_{$proc}.txt";
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
