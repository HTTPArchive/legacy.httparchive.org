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

// CVSNO - do this better
include './settings.inc';
require_once("../settings.inc");
require_once("../utils.php");

$gArchive = "All";
$gLabel = $argv[1];
$gStartUrl = $argv[2];
$gDbMax = $argv[3];
if ( !$gLabel ) {
	echo "You must specify a label.\n";
	exit();
}
$ghReqOtherHeaders = array();
$ghRespOtherHeaders = array();
$gMarks = array();
$gAggTimes = array();
$gAggCounts = array();

$results = array();

// see if there is an existing test we are working with
if( LoadResults($results) ) {
    // count the number of tests that don't have status yet
    $testCount = 0;
    foreach( $results as &$result ) {
        if( strlen($result['id']) && strlen($result['result']) && $result['medianRun'] ) {
            $testCount++;
		}
	}
            
    if( $testCount ) {
        echo "Checking HAR files for $testCount tests...\r\n";
        $dir = "./archives/$gArchive/$gLabel";
        if( !is_dir("$dir") ) {
            mkdir("$dir");
		}

        $count = 0;
		$dbcount = 0;
		$bStart = ( ! $gStartUrl );   // don't start if there's a "start" URL parameter
		t_mark('overall time');
        foreach( $results as &$result ) {
            if( strlen($result['id']) && strlen($result['result']) && $result['medianRun'] ) {
                $count++;

				$bStart = ( $bStart || $gStartUrl === $result['url'] );
				if ( ! $bStart ) {
					echo "skipping " . $result['url'] . "\n";
					continue;
				}

				t_mark('single url');
                $file = BuildFileName($result['url']);
				$fullpath = "./archives/$gArchive/$gLabel/$file.har";
                if( strlen($file) && !is_file("$fullpath") ) {
					t_mark('download HAR');
					echo "Retrieving HAR for test $count of $testCount...                  $file.har\n";
                    $response = file_get_contents("{$server}export.php?test={$result['id']}&run={$result['medianRun']}&cached=0");
                    if( strlen($response) ) {
                        file_put_contents("$fullpath", $response);
					}
					t_aggregate('download HAR');
                }
				else {
					//echo "\rSkipping HAR for test $count of $testCount...                  ";
				}

				// Check if this is in the DB
				$pageid = doSimpleQuery("select pageid from $gPagesTable where archive='$gArchive' and label='$gLabel' and harfile = '$fullpath';");
				if ( ! $pageid ) {
					t_mark('import to DB');
					echo "importing $fullpath...\n";
					importHarFile($fullpath, $result);
					t_aggregate('import to DB');
					$dbcount++;
				}
				t_aggregate('single url');
            }
			if ( $gDbMax && $gDbMax <= $dbcount ) {
				break;
			}
        }
		t_echo('overall time');
		t_echoagg();

        // clear the progress text
        echo "\nDone\r\n";
    }
    else {
        echo "No HAR files available for download\r\n";
	}
}
else {
    echo "No tests found in results.txt\r\n";  
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



/**
* Create a file name given an url
* 
* @param mixed $results
*/
function BuildFileName($url) {
    $file = trim($url, "\r\n\t \\/");
    $file = str_ireplace('http://', '', $file);
    $file = str_ireplace(':', '_', $file);
    $file = str_ireplace('/', '_', $file);
    $file = str_ireplace('\\', '_', $file);
    $file = str_ireplace('%', '_', $file);
    
    return $file;
}




// Import a specific HAR file.
function importHarFile($filename, $result) {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$json_text = file_get_contents($filename);
	$HAR = json_decode($json_text);
	$log = $HAR->{ 'log' };

	$pages = $log->{ 'pages' };
	$pagecount = count($pages);
	if ( 0 == $pagecount ) {
		dprint("ERROR: No pages found in file $filename");
		return false;
	}
	if ( 1 < $pagecount ) {
		dprint("ERROR: Only one page is expected per HAR file. This HAR file has " . count($pages) . " pages. Only the first page will be processed.\n");
	}

	// STEP 1: Create a partial "page" record so we get a pageid.
	t_mark('importPage');
	$pageid = importPage($pages[0], $filename);
	t_aggregate('importPage');
	if ( $pageid ) {
		$entries = $log->{ 'entries' };
		// STEP 2: Create all the resources & associate them with the pageid.
		$firstUrl = "";
		$firstHtmlUrl = "";
		t_mark('importEntries');
		$bEntries = importEntries($entries, $pageid, $firstUrl, $firstHtmlUrl);
		t_aggregate('importEntries');
		if ( false === $bEntries ) {
			dprint("ERROR: importEntries failed. Purging pageid $pageid");
			purgePage($pageid);
		}
		else {
			// STEP 3: Go back and fill out the rest of the "page" record based on all the resources.
			t_mark('aggregateStats');
			$url = aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $result);
			t_aggregate('aggregateStats');
			if ( false === $url ) {
				dprint("ERROR: aggregateStats failed. Purging pageid $pageid");
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
function importPage($page, $filename) {
	global $gPagesTable, $gRequestsTable;
	global $gArchive, $gLabel;

	$now = time();
	$aTuples = array();
	$pageref = $page->{ 'id' };

	// Add all the insert tuples to an array.
	array_push($aTuples, "createDate = $now");
	array_push($aTuples, "harfile = '$filename'");
	$startedDateTime = strtotime($page->{ 'startedDateTime' });
	array_push($aTuples, "startedDateTime = $startedDateTime");
	array_push($aTuples, "archive = '" . mysqlEscape($gArchive) . "'");
	if ( $gLabel ) {
		array_push($aTuples, "label = '" . mysqlEscape($gLabel) . "'");
	}
	$title = mysqlEscape($page->{ 'title' });
	array_push($aTuples, "title = '$title'");

	$pageTimings = $page->{ 'pageTimings' };
	$renderStart = $pageTimings->{ '_renderStart' };
	if ( $renderStart && 0 < $renderStart ) {
		array_push($aTuples, "renderStart = $renderStart");
	}
	$onContentLoaded = $pageTimings->{ 'onContentLoad' };
	if ( $onContentLoaded && 0 < $onContentLoaded ) {
		array_push($aTuples, "onContentLoaded = $onContentLoaded");
	}
	$onLoad = $pageTimings->{ 'onLoad' };
	if ( $onLoad && 0 < $onLoad ) {
		array_push($aTuples, "onLoad = $onLoad");
	}

	// Page Speed score
	t_mark('Page Speed');
	$output = array();
	$return_var = 128;
	exec("../har_to_pagespeed '$filename' 2>/dev/null", $output, $return_var);
	if ( 0 === $return_var ) {
		$totalScore = 0;
		$iScores = 0;
		$matches = array();
		for ( $i = 0; $i < count($output); $i++ ) {
			$line = $output[$i];
			if ( preg_match("/_(.*)_ \(score=([0-9]+)/", $line, $matches) &&
				 false === strpos($line, "Optimize images") ) {
				$totalScore += $matches[2];
				$iScores++;
			}
		}
		$overallScore = round($totalScore/$iScores);
		array_push($aTuples, "PageSpeed = $overallScore");
	}
	t_aggregate('Page Speed');

	$cmd = "replace into $gPagesTable set " . implode(", ", $aTuples) . ";";
	//dprint("$cmd");
	doSimpleCommand($cmd);

	// get the pageid
	$cmd = "select pageid from $gPagesTable where startedDateTime = $startedDateTime and harfile = '$filename';";
	//dprint("$cmd");
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
		array_push($aTuples, "url = '" . mysqlEscape($url) . "'");
		$urlShort = substr($url, 0, 255);
		array_push($aTuples, "urlShort = '" . mysqlEscape($urlShort) . "'");
		$reqHeaderSize = $request->{ 'headerSize' };
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
			array_push($aTuples, "reqOtherHeaders = '" . mysqlEscape($other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "reqCookieLen = $cookielen");
		}

		// RESPONSE
		$response = $entry->{ 'response' };
		$status = $response->{ 'status' };
		array_push($aTuples, "status = $status");
		array_push($aTuples, "respHttpVersion = '" . $response->{ 'httpVersion' } . "'");
		array_push($aTuples, "redirectUrl = '" . mysqlEscape($response->{ 'url' }) . "'");
		array_push($aTuples, "redirectUrlShort = '" . mysqlEscape(substr($response->{ 'url' }, 0, 255)) . "'");
		$respHeaderSize = $response->{ 'headerSize' };
		if ( $respHeaderSize && 0 < $respHeaderSize ) {
			array_push($aTuples, "respHeaderSize = $respHeaderSize");
		}
		$respBodySize = $response->{ 'bodySize' };
		if ( $respBodySize && 0 < $respBodySize ) {
			array_push($aTuples, "respBodySize = $respBodySize");
		}
		$content = $response->{ 'content' };
		array_push($aTuples, "respSize = " . $content->{ 'size' });
		array_push($aTuples, "mimeType = '" . mysqlEscape($content->{ 'mimeType' }) . "'");
	
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
			array_push($aTuples, "respOtherHeaders = '" . mysqlEscape($other) . "'");
		}
		if ( $cookielen ) {
			array_push($aTuples, "respCookieLen = $cookielen");
		}

		// NOW add all the headers from both the request and response.
		$aHeaders = array_keys($hHeaders);
		for ( $h = 0; $h < count($aHeaders); $h++ ) {
			$header = $aHeaders[$h];
			array_push($aTuples, "$header = '" . mysqlEscape($hHeaders[$header]) . "'");
		}

		$bFirstReq = 0;
		$bFirstHtml = 0;
		if ( ! $firstUrl ) {
			if ( 400 <= $status && $status <= 499 ) {
				dprint("ERROR: The first request ($url) failed with status $status.");
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

		$cmd = "replace into $gRequestsTable set " . implode(", ", $aTuples) . ";";
		//dprint("$cmd");
		doSimpleCommand($cmd);
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


// Collect all the aggregate stats for a single website.
function aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $resultTxt) {
	global $gPagesTable, $gRequestsTable;

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
			dprint("ERROR: No hostname found in URL: $url");
		}
	}
	mysql_free_result($result);
	$numDomains = count(array_keys($hDomains));

	// CVSNO - move this error checking to the point before this function is called
	if ( ! $firstUrl ) {
		dprint("ERROR: no first URL found for pageref $pageref.");
		return false;
	}
	$url = $firstUrl;
	$urlShort = substr($url, 0, 255);

	if ( ! $firstHtmlUrl ) {
		dprint("ERROR: no first HTML URL found for pageref $pageref.");
		return false;
	}
	$urlHtml = $firstHtmlUrl;
	$urlHtmlShort = substr($urlHtml, 0, 255);
		
	$cmd = "update $gPagesTable set url = '$url', urlShort = '$urlShort', urlHtml = '$urlHtml', urlHtmlShort = '$urlHtmlShort', reqTotal = $reqTotal, bytesTotal = $bytesTotal" .
		", reqHtml = " . $hCount['html'] . ", bytesHtml = " . $hSize['html'] . 
		", reqJS = " . $hCount['script'] . ", bytesJS = " . $hSize['script'] . 
		", reqCSS = " . $hCount['css'] . ", bytesCSS = " . $hSize['css'] . 
		", reqImg = " . $hCount['image'] . ", bytesImg = " . $hSize['image'] . 
		", reqFlash = " . $hCount['flash'] . ", bytesFlash = " . $hSize['flash'] . 
		", reqOther = " . $hCount['other'] . ", bytesOther = " . $hSize['other'] . 
		", numDomains = $numDomains" .
		", wptid = '" . $resultTxt['id'] . "', wptrun = " . $resultTxt['medianRun'] . ", renderStart = " . $resultTxt['startRender'] .
		" where pageid = $pageid;";
	//dprint($cmd);
	doSimpleCommand($cmd);

	return $url;
}


// Find the results for a given web site.
function parseResultsTxtUrl($pageid, $url, $hResultsTxt) {
	global $gPagesTable, $gRequestsTable;

	if ( ! array_key_exists($url, $hResultsTxt) ) {
		dprint("ERROR: URL $url not found in results.txt.");
		return false;
	}

	$aResults = $hResultsTxt[$url];
	$wptid = $aResults[0];
	$testresult = $aResults[1];
	$wptrun = $aResults[2];
	$loadTime = $aResults[3];
	$startRender = $aResults[4];
	$cmd = "update $gPagesTable set wptid = '$wptid', wptrun = $wptrun, renderStart = $startRender where pageid = $pageid;";
	//dprint($cmd);
	doSimpleCommand($cmd);

	return true;
}
