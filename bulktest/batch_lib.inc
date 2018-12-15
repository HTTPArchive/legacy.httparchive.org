<?php
/*
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

require_once("../utils.inc");
require_once("../status.inc");
require_once("../crawls.inc");
require_once("../urls.inc");

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
		$num_row = mysqli_num_rows($resource);
		if ( $num_row && 0 < $num_row )
			return false;
	}
	return true;
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
	global $video, $private, $runs, $docComplete, $fvonly, $mv, $wptApiKey, $gbNoScript, $gbMobileEmul;

	$wptServer = wptServer();
	$location = $record['location'];
	if ($location == 'California:Chrome.3G') {
		$location = 'California:Chrome.4G';
	}
	$request = $wptServer . 'runtest.php?f=xml&debug=1&priority=6&timeline=1&url=' . urlencode($record['url']) . 
		"&location=$location&runs=$runs" .
		( $private ? "&private=1" : "" ) .
		( $video ? "&video=1" : "" ) .
		"&web10=" . ( $docComplete ? "1" : "0" ) .
		( $gbMobileEmul ? "&mobile=1&lighthouse=1" : "" ) .
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
	global $gMaxQueueLength;
	$submittedTests = countTestsWithCode(SUBMITTED);
	$unsubmitTests = obtainTestsWithCode(NOT_STARTED);
	if ( !isEmptyQuery($unsubmitTests) ) {
		while ($row = mysqli_fetch_assoc($unsubmitTests)) {
			submitTest($row, 0);
			// Limit the number of in-flight tests
			if ($gMaxQueueLength) {
				$submittedTests++;
				if ($submittedTests >= $gMaxQueueLength)
					break;
			}
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
		while ( $row = mysqli_fetch_assoc($result) ) {
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
					elseif ( 400 <= $code || 100 > $code ) {
						$nNoResult = 0; // reset
						setStatus($row['statusid'], SUBMITTED + $gErrBase);
					}
					else {
						$nNoResult++;
						if ( $nNoResult > 2000 ) {
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
		while ( $row = mysqli_fetch_assoc($tests) ) {
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
					dprint("ERROR: couldn't find median page view for wptid $wptid.");
					setStatus($statusid, SUBMIT_DONE + $gErrBase);
				}
			} 
			else {
				dprint("ERROR: failed parsing $request: status = $status, runs = $runs");
				setStatus($statusid, SUBMIT_DONE + $gErrBase);
			}
		}
	}
}


// Fill the pagestable and requesttable with the info of the median run.
function fillTables($divisor=NULL, $modulo=NULL) {
	$tests = obtainTestsWithCode(META_DONE, $divisor, $modulo);

	if ( !IsEmptyQuery($tests) ) {
		$totalParsed = 0;
		while ($statusInfo = mysqli_fetch_assoc($tests)) {
			t_mark('importWptResults');
			//tprint("parse proc # " . (1+$modulo) . ", statusid = " . $statusInfo['statusid'] . ", total = $totalParsed");
			$status = importWptResults($statusInfo);
			t_aggregate('importWptResults');
			setStatus($statusInfo['statusid'], $status);
			$totalParsed++;
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
		if ( importHarJson($response, $statusInfo) ) {
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
		$bEntries = importEntries($entries, $pageid, $statusInfo, $firstUrl, $firstHtmlUrl);
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
	$crawlid = $statusInfo['crawlid'];
	$link = getDBConnection();
	if ( ! $label || ! $crawlid ) {
		dprint("ERROR: 'label' or 'crawlid' was null in importPage");
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
	array_push($aTuples, "archive = '" . mysqli_real_escape_string($link, $archive) . "'");
	array_push($aTuples, "label = '" . mysqli_real_escape_string($link, $label) . "'");
	array_push($aTuples, "crawlid = $crawlid");
	array_push($aTuples, "url = '" . mysqli_real_escape_string($link, $url) . "'");
	array_push($aTuples, "urlhash = " . getUrlhashFunc($url));
	array_push($aTuples, "urlShort = '" . mysqli_real_escape_string($link, $urlShort) . "'");
	if ( array_key_exists('_TTFB', $page) && $page->{'_TTFB'} ) {
		array_push($aTuples, "TTFB = " . $page->{'_TTFB'});
	}
	array_push($aTuples, "renderStart = " . $page->{'_render'});
	array_push($aTuples, "fullyLoaded = " . $page->{'_fullyLoaded'});
	array_push($aTuples, "visualComplete = " . $page->{'_visualComplete'});
	$onload = $page->{'_docTime'};
	if ( 0 == $onload ) {
		// sometimes (<1%) there's no onload value so let's use the max of the other values
		$onload = max($page->{'_visualComplete'}, $page->{'_fullyLoaded'});
	}
	array_push($aTuples, "onLoad = " . $onload);

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
		array_push($aTuples, "cdn = '" . mysqli_real_escape_string($link, $page->{'_base_page_cdn'}) . "'");
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
	if ( array_key_exists('_connections', $page) ) {
		array_push($aTuples, "_connections = " . $page->{'_connections'});
	}
	if ( array_key_exists('_adult_site', $page) ) {
		array_push($aTuples, "_adult_site = " . $page->{'_adult_site'});
	}
	if ( array_key_exists('_avg_dom_depth', $page) ) {
		array_push($aTuples, "avg_dom_depth = " . $page->{ '_avg_dom_depth' });
	}
	if ( array_key_exists('_doctype', $page) ) {
		array_push($aTuples, "doctype = '" . mysqli_real_escape_string($link, $page->{ '_doctype' }) . "'");
	}
	if ( array_key_exists('_document_height', $page) && 0 < $page->{ '_document_height' } ) {
		array_push($aTuples, "document_height = " . $page->{ '_document_height' });
	}
	if ( array_key_exists('_document_width', $page) && 0 < $page->{ '_document_width' } ) {
		array_push($aTuples, "document_width = " . $page->{ '_document_width' });
	}
	if ( array_key_exists('_localstorage_size', $page) && 0 < $page->{ '_localstorage_size' } ) {
		array_push($aTuples, "localstorage_size = " . $page->{ '_localstorage_size' });
	}
	if ( array_key_exists('_sessionstorage_size', $page) && 0 < $page->{ '_sessionstorage_size' } ) {
		array_push($aTuples, "sessionstorage_size = " . $page->{ '_sessionstorage_size' });
	}
	if ( array_key_exists('_meta_viewport', $page) ) {
		array_push($aTuples, "meta_viewport = '" . mysqli_real_escape_string($link, $page->{ '_meta_viewport' }) . "'");
	}
	if ( array_key_exists('_num_iframes', $page) ) {
		array_push($aTuples, "num_iframes = " . $page->{ '_num_iframes' });
	}
	if ( array_key_exists('_num_scripts', $page) ) {
		array_push($aTuples, "num_scripts = " . $page->{ '_num_scripts' });
	}
	if ( array_key_exists('_num_scripts_sync', $page) ) {
		array_push($aTuples, "num_scripts_sync = " . $page->{ '_num_scripts_sync' });
	}
	if ( array_key_exists('_num_scripts_async', $page) ) {
		array_push($aTuples, "num_scripts_async = " . $page->{ '_num_scripts_async' });
	}
	if ( array_key_exists('_usertiming', $page) ) {
		array_push($aTuples, "usertiming = " . $page->{ '_usertiming' });
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
function importEntries($entries, $pageid, $statusInfo, &$firstUrl, &$firstHtmlUrl) {
	global $gPagesTable, $gRequestsTable;
	global $ghReqHeaders, $ghRespHeaders;
	$link = getDBConnection();
	for ( $i = 0; $i < count($entries); $i++ ) {
		$entry = $entries[$i];
		$aTuples = array();
		array_push($aTuples, "pageid = $pageid");
		array_push($aTuples, "crawlid = " . $statusInfo['crawlid']);
		$startedDateTime = strtotime($entry->{ 'startedDateTime' }); // we use this below for expAge calculation
		array_push($aTuples, "startedDateTime = $startedDateTime");
		array_push($aTuples, "time = " . $entry->{ 'time' });
		if ( property_exists($entry, '_cdn_provider') && null !== $entry->{'_cdn_provider'} ) {
			array_push($aTuples, "_cdn_provider = '" . mysqli_real_escape_string($link, $entry->{ '_cdn_provider' }) . "'");
		}
		if ( property_exists($entry, '_gzip_save') && null !== $entry->{'_gzip_save'} ) {
			array_push($aTuples, "_gzip_save = " . $entry->{ '_gzip_save' });  // amount response WOULD have been reduced if it had been gzipped
		}

		// REQUEST
		$request = $entry->{ 'request' };
		array_push($aTuples, "method = '" . $request->{ 'method' } . "'");
		array_push($aTuples, "reqHttpVersion = '" . $request->{ 'httpVersion' } . "'");
		$url = $request->{ 'url' };
		array_push($aTuples, "url = '" . mysqli_real_escape_string($link, $url) . "'");
		$urlShort = substr($url, 0, 255);
		array_push($aTuples, "urlShort = '" . mysqli_real_escape_string($link, $urlShort) . "'");
		$reqHeadersSize = $request->{ 'headersSize' };
		if ( $reqHeadersSize && 0 < $reqHeadersSize ) {
			array_push($aTuples, "reqHeadersSize = $reqHeadersSize");
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
			array_push($aTuples, "reqOtherHeaders = '" . mysqli_real_escape_string($link, $other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "reqCookieLen = $cookielen");
		}

		// RESPONSE
		$response = $entry->{ 'response' };
		$status = $response->{ 'status' };
		array_push($aTuples, "status = $status");
		array_push($aTuples, "respHttpVersion = '" . $response->{ 'httpVersion' } . "'");
		if ( property_exists($response, 'url') && null !== $response->{'url'} ) {
			array_push($aTuples, "redirectUrl = '" . mysqli_real_escape_string($link, $response->{ 'url' }) . "'");
		}
		$respHeadersSize = $response->{ 'headersSize' };
		if ( $respHeadersSize && 0 < $respHeadersSize ) {
			array_push($aTuples, "respHeadersSize = $respHeadersSize");
		}
		$respBodySize = $response->{ 'bodySize' };
		if ( $respBodySize && 0 < $respBodySize ) {
			array_push($aTuples, "respBodySize = $respBodySize");
		}
		$content = $response->{ 'content' };
		array_push($aTuples, "respSize = " . $content->{ 'size' });
		$mimeType = mysqli_real_escape_string($link, $content->{ 'mimeType' });
		array_push($aTuples, "mimeType = '$mimeType'");
		$ext = mysqli_real_escape_string($link, getExt($url));
		array_push($aTuples, "ext = '$ext'");
		$type = prettyType($mimeType, $ext);
		array_push($aTuples, "type = '$type'");
		$format = getFormat($type, $mimeType, $ext);
		array_push($aTuples, "format = '$format'");
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
			array_push($aTuples, "respOtherHeaders = '" . mysqli_real_escape_string($link, $other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "respCookieLen = $cookielen");
		}
		// calculate expAge - number of seconds before resource expires
		// CVSNO - use the new computeRequestExpAge function.
		$expAge = 0;
		$cc = ( array_key_exists('resp_cache_control', $hHeaders) ? $hHeaders['resp_cache_control'] : null );
		if ( $cc && 
			 ( FALSE !== stripos($cc, "must-revalidate") || FALSE !== stripos($cc, "no-cache") || FALSE !== stripos($cc, "no-store") ) ) {
			// These directives dictate the response can NOT be cached.
			$expAge = 0;
		}
		else if ( $cc  && FALSE !== ($posMaxage = stripos($cc, "max-age=")) ) {
			$expAge = intval(substr($cc, $posMaxage+8));
		}
		else if ( array_key_exists('resp_expires', $hHeaders) ) {
			// According to RFC 2616 ( http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.2.4 ):
			//     freshness_lifetime = expires_value - date_value
			// If the Date: response header is present, we use that.
			// Otherwise we fall back to $startedDateTime which is based on the client so might suffer from clock skew.
			$startEpoch = ( array_key_exists('resp_date', $hHeaders) ? strtotime($hHeaders['resp_date']) : $startedDateTime );
			$expAge = strtotime($hHeaders['resp_expires']) - $startEpoch;
		}
		array_push($aTuples, "expAge = " . ( $expAge < 0 ? 0 : $expAge ));

		// NOW add all the headers from both the request and response.
		$aHeaders = array_keys($hHeaders);
		for ( $h = 0; $h < count($aHeaders); $h++ ) {
			$header = $aHeaders[$h];
			array_push($aTuples, "$header = '" . mysqli_real_escape_string($link, $hHeaders[$header]) . "'");
		}

		// CUSTOM RULES
		if ( array_key_exists('_custom_rules', $entry) ) {
			$customrules = $entry->{'_custom_rules'};
			if ( array_key_exists('ModPageSpeed', $customrules) ) {
				$count = $customrules->{'ModPageSpeed'}->{'count'};
				// TODO array_push($aTuples, "reqBodySize = $count");
			}
		}

		// wrap it up
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
		if ( ! $firstHtmlUrl && 200 == $status && $type == 'html' ) {
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
	$link = getDBConnection();

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
	// This is a list of all mime types AND file formats that we care about.
	foreach(array("css", "image", "script", "html", "font", "other", "audio", "video", "text", "xml", "gif", "jpg", "png", "webp", "svg", "ico", "flash", "swf", "mp4", "flv", "f4v") as $type) {
		// initialize the hashes
		$hSize[$type] = 0;
		$hCount[$type] = 0;
	}
	$hDomains = array();
	$maxageNull = $maxage0 = $maxage1 = $maxage30 = $maxage365 = $maxageMore = 0;
	$bytesHtmlDoc = $numRedirects = $numErrors = $numGlibs = $numHttps = $numCompressed = $maxDomainReqs = 0;

	$result = doQuery("select type, format, urlShort, resp_content_type, respSize, expAge, firstHtml, status, resp_content_encoding, req_host from $gRequestsTable where pageid = $pageid;");
	while ($row = mysqli_fetch_assoc($result)) {
		$url = $row['urlShort'];
		$prettyType = $row['type'];
		$respSize = intval($row['respSize']);
		$reqTotal++;
		$bytesTotal += $respSize;
		$hCount[$prettyType]++;
		$hSize[$prettyType] += $respSize;

		$format = $row['format'];
		if ( $format && ("image" === $prettyType || "video" === $prettyType) ) {
			$hCount[$format]++;
			$hSize[$format] += $respSize;
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
	mysqli_free_result($result);
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
		", reqAudio = " . $hCount['audio'] . ", bytesAudio = " . $hSize['audio'] .
		", reqVideo = " . $hCount['video'] . ", bytesVideo = " . $hSize['video'] .
		", reqText = " . $hCount['text'] . ", bytesText = " . $hSize['text'] .
		", reqXml = " . $hCount['xml'] . ", bytesXml = " . $hSize['xml'] .
		", reqWebp = " . $hCount['webp'] . ", bytesWebp = " . $hSize['webp'] .
		", reqSvg = " . $hCount['svg'] . ", bytesSvg = " . $hSize['svg'] .
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
		", wptid = " . "'" . mysqli_real_escape_string($link, $statusInfo['wptid']) . "'" . 
		", wptrun = " . $statusInfo['medianRun'] . 
		( $statusInfo['rank'] ? ", rank = " . $statusInfo['rank'] : "" ) .
		" where pageid = $pageid;";
	doSimpleCommand($cmd);

	return true;
}

function countTestsWithCode($status, $statusTable="") {
	global $gStatusTable;

	$statusTable = ( $statusTable ? $statusTable : $gStatusTable );
	$query = "SELECT COUNT(*) FROM $statusTable" . ( -1 == $status ? ";" : " WHERE status=$status;" );
	return doSimpleQuery($query);
}

function countFailedTests($statusTable="") {
	global $gStatusTable, $gErrBase;

	$statusTable = ( $statusTable ? $statusTable : $gStatusTable );
	$query = "SELECT COUNT(*) FROM $statusTable WHERE status >= $gErrBase;";
	return doSimpleQuery($query);
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
function prettyType($mimeType, $ext) {
	$mimeType = strtolower($mimeType);

	// Order by most unique first.
	// Do NOT do html because "text/html" is often misused for other types. We catch it below.
	foreach(array("font", "css", "image", "script", "video", "audio", "xml") as $type) {
		if ( false !== strpos($mimeType, $type) ) {
			return $type;
		}
	}

	// Special cases I found by manually searching.
	if ( false !== strpos($mimeType, "json") || "js" === $ext || "json" === $ext ) {
		return "script";
	}
	else if ( "eot" === $ext || "ttf" === $ext || "woff" === $ext || "woff2" === $ext || "otf" === $ext ) {
		return "font";
	}
	else if ( "png" === $ext || "gif" === $ext || "jpg" === $ext || "jpeg" === $ext || "webp" === $ext || "ico" === $ext || "svg" === $ext ) {
		return "image";
	}
	else if ( "css" === $ext ) {
		return "css";
	}
	else if ( "xml" === $ext ) {
		return "xml";
	}
    //Video extensions mp4, webm, ts, m4v, m4s, m4v, mov, ogv
	else if ( false !== strpos($mimeType, "flash") || false !== strpos($mimeType, "webm") || false !== strpos($mimeType, "mp4") || false !== strpos($mimeType, "flv")
       ||  "mp4" === $ext || "webm" === $ext || "ts" == $ext || "m4v" === $ext || "m4s" === $ext || "mov" === $ext || "ogv" === $ext
       ||  "swf" === $ext || "f4v" === $ext || "flv" === $ext ) {
		return "video";
	}
	else if ( false !== strpos($mimeType, "html") || "html" === $ext || "htm" === $ext ) {
		// Here is where we catch "text/html" mime type.
		return "html";
	}
	else if ( false !== strpos($mimeType, "text") ) {
		// Put "text" LAST because it's often misused so $ext should take precedence.
		return "text";
	}

	return "other";
}


function getFormat($prettyType, $mimeType, $ext) {
	if ( "image" === $prettyType ) {
		// Order by most popular first.
		foreach( array("jpg", "png", "gif", "webp", "svg", "ico") as $type) {
			if ( false !== strpos($mimeType, $type) || $ext === $type ) {
				return $type;
			}
		}

		if ( false !== strpos($mimeType, "jpeg") || $ext === "jpeg" ) {
			return "jpg";
		}
	}
	if ( "video" === $prettyType ) {
		// Order by most popular first.
		foreach( array("flash", "swf", "mp4", "flv", "f4v") as $type) {
			if ( false !== strpos($mimeType, $type) || $ext === $type ) {
				return $type;
			}
		}
	}

	return "";
}


function getExt($ext) {
	$iQ = strpos($ext, "?");
	if ( $iQ ) {
		$ext = substr($ext, 0, $iQ);
	}

	$ext = substr($ext, strrpos($ext, "/")+1);

	$iDot = strrpos($ext, ".");
	if ( FALSE === $iDot ) {
		$ext = "";
	}
	else {
		$ext = substr($ext, $iDot+1);
		if ( strlen($ext) > 5 ) {
			// This technique can find VERY long strings that are not file extensions. Try to weed those out.
			$ext = "";
		}
	}

	return $ext;
}


function lockFilename($device, $proc="uber") { // CVSNO - go back and remove $device from all callers
	// The file used as a file lock to coordinate the interaction of processes.
	$lockFile = __DIR__ . "/httparchive_batch_lock_{$proc}.txt";
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
