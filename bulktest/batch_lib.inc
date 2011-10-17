<?php

require_once("../utils.inc");

$gArchiveDir = dirname(getcwd()) . "/archives";  // CVSNO

define("NOT_STARTED", 0);
define("SUBMITTED", 1);
define("SUBMIT_DONE", 2);
define("META_DONE", 3);
define("DONE", 4);


// Obtain the tests with specified status code
function obtainTestsWithCode($status) {
	global $gStatusTable;
	$query = "SELECT * FROM $gStatusTable WHERE status = $status;";
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
	$now = time();
	$cmd = sprintf("UPDATE %s SET status = %d, timeOfLastChange = '%s' WHERE statusid = %d;", $gStatusTable, $status, mysql_real_escape_string($now), $statusid);
	doSimpleCommand($cmd);
}


// Submit the unfinished tests to WPT
function submitTest(&$record, $status) {
	global $gStatusTable, $gErrBase;
	global $video, $private, $runs, $docComplete, $fvonly, $mv, $wptApiKey;

	$wptServer = wptServer();
	$request = $wptServer . 'runtest.php?f=xml&priority=6&url=' . urlencode($record['url']) . "&location={$record['location']}&runs=$runs";
	if( $private )
		$request .= '&private=1';
	if ( $video )
		$request .= '&video=1';
	if ( $docComplete )
		$request .= '&web10=1';
	if ( $fvonly )
		$request .= '&fvonly=1';
	if ( $mv )
		$request .= '&mv=1';
	if ( $wptApiKey )
		$request .= "&k=$wptApiKey";

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
				$cmd = sprintf("UPDATE %s SET wptid = '%s', wptRetCode = %d WHERE statusid = %d;", $gStatusTable, mysql_real_escape_string($id), $code, $record['statusid']);
				doSimpleCommand($cmd);
				setStatus($record['statusid'], SUBMITTED);
			} else {
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
						break;
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
	$result['pagespeedScore'] = (int)$median->getElementsByTagName('PageSpeedScore')->item(0)->nodeValue;
}


// Obtain XML file of the test result
function obtainXMLResult() {
	global $gStatusTable, $gErrBase;

	$wptServer = wptServer();
	$tests = obtainTestsWithCode(SUBMIT_DONE);
	if ( !isEmptyQuery($tests) ) {
		while ( $row = mysql_fetch_assoc($tests) ) {
			// Fetch the result xml file
			$doc = new DOMDocument();
			if ( $doc ) {
				$request = $wptServer . "xmlResult.php?test=" . $row['wptid'] . "&pagespeed=1";
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
						$cmd = "UPDATE $gStatusTable SET medianRun = $result[medianRun], startRender = $result[startRender], pagespeedScore = $result[pagespeedScore] WHERE statusid = $row[statusid];";
						doSimpleCommand($cmd);
						setStatus($row['statusid'], META_DONE); 
					} else {
						setStatus($row['statusid'], SUBMIT_DONE + $gErrBase);
					}
				}
			}
		}
	}
}


// Fill the pagestable and requesttable with the info of the median run.
function fillTables() {
	global $gErrBase;

	$wptServer = wptServer();
	$tests = obtainTestsWithCode(META_DONE);
	if ( !IsEmptyQuery($tests) ) {
		while ($row = mysql_fetch_assoc($tests)) {
			// We refetch a php compatible HAR file from WPT server instead of using the local copy.
			$request = $wptServer . "export.php?test={$row['wptid']}&run={$row['medianRun']}&cached=0&php=1";
			$response = fetchUrl($request);
			if ( strlen($response) ) {
				if ( ImportHarJson($response, $row) )
					setStatus($row['statusid'], DONE);
				else
					setStatus($row['statusid'], META_DONE + $gErrBase); // CVSNO
			}
		}
	}
}


// Import a specific HAR JSON response.
function importHarJson($json_text, $result) {
	global $gStatusTable, $gPagesTable, $gRequestsTable;
	if ( !$json_text ) {
		dprint("ERROR($gStatusTable statusid: $result[statusid]): HAR file read error.");
		return false;
	}
	$HAR = json_decode($json_text);
	if ( NULL == $HAR ) {
		dprint("ERROR($gStatusTable statusid: $result[statusid]): JSON decode failed");
		return false;
	}
	$log = $HAR->{ 'log' };

	$pages = $log->{ 'pages' };
	$pagecount = count($pages);
	if ( 0 == $pagecount ) {
		dprint("ERROR($gStatusTable statusid: $result[statusid]):: No pages found");
		return false;
	}
	if ( 1 < $pagecount ) {
		dprint("WARNING($gStatusTable statusid: $result[statusid]):: Only one page is expected per HAR file. This HAR file has " . count($pages) . " pages. Only the first page will be processed.\n");
	}

	// STEP 1: Create a partial "page" record so we get a pageid.
	t_mark('ImportPage');
	$pageid = importPage($pages[0], $result);
	t_aggregate('ImportPage');
	if ( $pageid ) {
		$entries = $log->{ 'entries' };
		// STEP 2: Create all the resources & associate them with the pageid.
		$firstUrl = "";
		$firstHtmlUrl = "";
		t_mark('ImportEntries');
		$bEntries = importEntries($entries, $pageid, $firstUrl, $firstHtmlUrl);
		t_aggregate('ImportEntries');
		if ( false === $bEntries ) {
			dprint("ERROR($gStatusTable statusid: $result[statusid]): ImportEntries failed. Purging pageid $pageid");
			purgePage($pageid);
		} else {
			// STEP 3: Go back and fill out the rest of the "page" record based on all the resources.
			t_mark('AggregateStats');
			$url = aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $result);
			t_aggregate('AggregateStats');
			if ( false === $url ) {
				dprint("ERROR($gStatusTable statusid: $result[statusid]): AggregateStats failed. Purging pageid $pageid");
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
function importPage($page, $result) {
	global $gPagesTable, $gRequestsTable, $gArchiveDir;;
	$archive = $result['archive'];
	$label = $result['label'];

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
		//dprint("$cmd");
		doSimpleCommand($cmd);
	}
}

// Collect all the aggregate stats for a single website.
function aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $resultRow) {
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

	t_mark('aggregateStats query');
	$result = doQuery("select mimeType, urlShort, respSize from $gRequestsTable where pageid = $pageid;");
	t_aggregate('aggregateStats query');
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

	$rank = doSimpleQuery("select rank from $gUrlsTable where url='$url';");

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
		", wptid = " . "'" . mysql_real_escape_string($resultRow['wptid']) . "'" . 
		", wptrun = " . $resultRow['medianRun'] . 
		", renderStart = " . $resultRow['startRender'] . 
		", PageSpeed = " . $resultRow['pagespeedScore'] .
		( $rank ? ", rank = $rank" : "" ) . 
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
	global $gErrBase;

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

	lprint("Total URLs: $totalUrls");
	$total_in_processing = $loadedUrls + $submittedTests + $completedTests;
	lprint("Tests in processing: $total_in_processing");
	lprint("	-Waiting to be submitted: $loadedUrls");
	lprint("	-Waiting for test results: $submittedTests");
	lprint("	-Waiting to process results: $completedTests");
	lprint("Waiting to process HAR: $xmlDoneTests");
	lprint("Successfully processed: $successfulTests");
	lprint("Tests failed: $failedTests");
	if ( $failedSubmission > 0 )
		lprint("	-Submission failed: $failedSubmission");
	if ( $failedWPTTesting > 0 )
		lprint("	-WPT tests failed: $failedWPTTesting");
	if ( $failedProcessResult > 0 )
		lprint("	-Test result processing failed: $failedProcessResult");
	if ( $failedImportHar > 0 ) 
		lprint("	-Har importing failed: $failedImportHar");

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

?>
