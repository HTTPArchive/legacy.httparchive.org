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

// CVSNO - hardwired
$gArchive = "All";
$gLabel = "Nov 22 2010";
$ghReqOtherHeaders = array();
$ghRespOtherHeaders = array();

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
        foreach( $results as &$result ) {
            if( strlen($result['id']) && strlen($result['result']) && $result['medianRun'] ) {
                $count++;

                $file = BuildFileName($result['url']);
				$fullpath = "./archives/$gArchive/$gLabel/$file.har";
                if( strlen($file) && !is_file("$fullpath") ) {
					echo "Retrieving HAR for test $count of $testCount...                  $file.har\n";
                    $response = file_get_contents("{$server}export.php?test={$result['id']}&run={$result['medianRun']}&cached=0");
                    if( strlen($response) ) {
                        file_put_contents("$fullpath", $response);
					}
                }
				else {
					//echo "\rSkipping HAR for test $count of $testCount...                  ";
				}

				// Check if this is in the DB
				$pageid = doSimpleQuery("select pageid from $gPagesTable where archive='$gArchive' and label='$gLabel' and harfile = '$fullpath';");
				if ( ! $pageid ) {
					echo "importing $fullpath...\n";
					importHarFile($fullpath, $result);
				}
            }
        }

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
	$pageid = importPage($pages[0], $filename);
	if ( $pageid ) {
		$entries = $log->{ 'entries' };
		// STEP 2: Create all the resources & associate them with the pageid.
		$firstUrl = "";
		$firstHtmlUrl = "";
		if ( false === importEntries($entries, $pageid, $firstUrl, $firstHtmlUrl) ) {
			dprint("ERROR: importEntries failed. Purging pageid $pageid");
			purgePage($pageid);
		}
		else {
			// STEP 3: Go back and fill out the rest of the "page" record based on all the resources.
			$url = aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $result);
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


// Collect all the aggregate stats for a single website.
function aggregateStats($pageid, $firstUrl, $firstHtmlUrl, $resultTxt) {
	global $gPagesTable, $gRequestsTable;

	// CVSNO - do this faster - request all the rows in one query and then iterate over them
    $result = doQuery("select count(*) as reqs, sum(respSize) as bytes from $gRequestsTable where pageid = $pageid;");
	$row = mysql_fetch_assoc($result);
	$reqTotal = $row['reqs'];
	$bytesTotal = $row['bytes'];
	if ( ! $bytesTotal ) $bytesTotal = 0;
	mysql_free_result($result);

	$result = doQuery("select count(*) as reqs, sum(respSize) as bytes from $gRequestsTable where pageid = $pageid and mimeType like '%html%';");
	$row = mysql_fetch_assoc($result);
	$reqHtml = $row['reqs'];
	$bytesHtml = $row['bytes'];
	if ( ! $bytesHtml ) $bytesHtml = 0;
	mysql_free_result($result);

	$result = doQuery("select count(*) as reqs, sum(respSize) as bytes from $gRequestsTable where pageid = $pageid and mimeType like '%script%';");
	$row = mysql_fetch_assoc($result);
	$reqJS = $row['reqs'];
	$bytesJS = $row['bytes'];
	if ( ! $bytesJS ) $bytesJS = 0;
	mysql_free_result($result);

	$result = doQuery("select count(*) as reqs, sum(respSize) as bytes from $gRequestsTable where pageid = $pageid and mimeType like '%css%';");
	$row = mysql_fetch_assoc($result);
	$reqCSS = $row['reqs'];
	$bytesCSS = $row['bytes'];
	if ( ! $bytesCSS ) $bytesCSS = 0;
	mysql_free_result($result);

	$result = doQuery("select count(*) as reqs, sum(respSize) as bytes from $gRequestsTable where pageid = $pageid and mimeType like '%image%';");
	$row = mysql_fetch_assoc($result);
	$reqImg = $row['reqs'];
	$bytesImg = $row['bytes'];
	if ( ! $bytesImg ) $bytesImg = 0;
	mysql_free_result($result);

	$result = doQuery("select count(*) as reqs, sum(respSize) as bytes from $gRequestsTable where pageid = $pageid and mimeType like '%flash%';");
	$row = mysql_fetch_assoc($result);
	$reqFlash = $row['reqs'];
	$bytesFlash = $row['bytes'];
	if ( ! $bytesFlash ) $bytesFlash = 0;
	mysql_free_result($result);

	$reqOther = $reqTotal - ($reqHtml + $reqJS + $reqCSS + $reqImg + $reqFlash);
	$bytesOther = $bytesTotal - ($bytesHtml + $bytesJS + $bytesCSS + $bytesImg + $bytesFlash);

	// count unique domains (really hostnames)
	$query = "select urlShort from $gRequestsTable where pageid = $pageid;";
	$result = doQuery($query);
	$hDomains = array();
	while ($row = mysql_fetch_assoc($result)) {
		$url = $row['urlShort'];
		$aMatches = array();
		if ( $url && preg_match('/http[s]*:\/\/([^\/]*)/', $url, $aMatches) ) {
			$hostname = $aMatches[1];
			$hDomains[$hostname] = 1;
		}
		else { 
			dprint("ERROR: No hostname found in URL: $url");
		}
	}
	mysql_free_result($result);
	$numDomains = count(array_keys($hDomains));

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
		
	$cmd = "update $gPagesTable set url = '$url', urlShort = '$urlShort', urlHtml = '$urlHtml', urlHtmlShort = '$urlHtmlShort', reqTotal = $reqTotal, reqHtml = $reqHtml, reqJS = $reqJS, reqCSS = $reqCSS, reqImg = $reqImg, reqFlash = $reqFlash, reqOther = $reqOther, bytesTotal = $bytesTotal, bytesHtml = $bytesHtml, bytesJS = $bytesJS, bytesCSS = $bytesCSS, bytesImg = $bytesImg, bytesFlash = $bytesFlash, bytesOther = $bytesOther, numDomains = $numDomains" .
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
