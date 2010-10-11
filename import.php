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

require_once("utils.php");

$gArchive = $argv[1];
$gLabel = $argv[2];
$gHarfile = $argv[3];
$gStartHarfile = "";

if ( ! $gArchive ) {
	echo "ERROR: You must provide an archive name.\n";
	usage();
	exit();
}

echo "Starting to import archive \"$gArchive\" and label \"$gLabel\" and HAR file \"$gHarfile\" in 10 seconds...\n";
sleep(10);




$ghReqOtherHeaders = array();
$ghRespOtherHeaders = array();
$gNoPages = "";


createTables();
if ( $gHarfile ) {
	importHarFile("archives/$gArchive/" . ( $gLabel ? "$gLabel/" : "" ) . $gHarfile, $gArchive, $gLabel);
}
else {
	importAll($gArchive, $gLabel);
}


/*
// This was code for helping select the most popular HTTP headers to break out as separate columns.
echo "Other Request Headers:\n";
$aKeys = array_keys($ghReqOtherHeaders);
for ( $k = 0; $k < count($aKeys); $k++ ) {
	$key = $aKeys[$k];
	echo $ghReqOtherHeaders[$key] . " - $key\n";
}
echo "\nOther Response Headers:\n";
$aKeys = array_keys($ghRespOtherHeaders);
for ( $k = 0; $k < count($aKeys); $k++ ) {
	$key = $aKeys[$k];
	echo $ghRespOtherHeaders[$key] . " - $key\n";
}
*/

if ( $gNoPages ) {
	echo "\n=== A \"pages\" array was not found in these HAR files:\n$gNoPages\n";
}

echo "DONE!\n\n";


// Import all the HAR files for a given run.
function importAll($archive, $label) {
	global $gStartHarfile;

	// Parse the bulktest results file and save results based on URL.
	$hResultsTxt = array();
	if ( ! parseResultsTxt($archive, $label, $hResultsTxt) ) {
		dprint("ERROR: parseResultsTxt failed - aborting import.");
		return false;
	}

	$harDir = getHarDir($archive, $label);

	$dirObj = opendir($harDir);
	$aFilenames = array();
	while($filename = readdir($dirObj)) {
		if ( 0 < strpos($filename, ".har") ) {
			$aFilenames[] = $filename;
		}
	}
	closedir($dirObj);

	sort($aFilenames);
	$bStart = ( $gStartHarfile ? 0 : 1 );
	for ( $f = 0; $f < count($aFilenames); $f++ ) {
		$filename = $aFilenames[$f];
		if ( $filename == $gStartHarfile ) {
			$bStart = 1;
		}

		if ( ! $bStart ) {
			echo "skipping $filename\n";
			continue;
		}

		echo "start import $filename...";
		importHarFile($harDir . $filename, $archive, $label, $hResultsTxt);
		echo "done\n";
	}
}


// Import a specific HAR file.
function importHarFile($filename, $archive, $label, $hResultsTxt) {
	global $gPagesTable, $gRequestsTable;

	$json_text = file_get_contents($filename);
	$HAR = json_decode($json_text);
	$log = $HAR->{ 'log' };

	$hPagerefs = array();  // mapping of pageref to MySQL pageid
	$hPageidUrls = array();  // the first resource URL found for a given pageid
	$hPageidUrlsHtml = array(); // the first resource URL found that's HTML (actually 200 status)

	$pages = $log->{ 'pages' };
	$pageid = importPages($pages, $filename, $archive, $label, $hPagerefs);
	if ( $pageid ) {
		$entries = $log->{ 'entries' };
		if ( false === importEntries($entries, $hPagerefs, $hPageidUrls, $hPageidUrlsHtml) ) {
			dprint("ERROR: importEntries failed. Purging pageid $pageid");
			purgePage($pageid);
		}
		else {
			$url = aggregateStats($hPagerefs, $hPageidUrls, $hPageidUrlsHtml);
			if ( false === $url ) {
				dprint("ERROR: aggregateStats failed. Purging pageid $pageid");
				purgePage($pageid);
			}
			else {
				if ( false === parseResultsTxtUrl($pageid, $url, $hResultsTxt) ) {
					dprint("ERROR: parseResultsTxtUrl failed. Purging pageid $pageid");
					purgePage($pageid);
				}
				else {
					return true;
				}
			}
		}
	}

	return false;
}



// Import a website.
// MAJOR ASSUMPTION: THERE'S ONLY ONE PAGE PER HAR FILE!
// (otherwise, harviewer and har_to_pagespeed won't work)
function importPages($pages, $filename, $archive, $label, &$hPagerefs) {
	global $gPagesTable, $gRequestsTable, $gNoPages;

	if ( 0 == count($pages) ) {
		dprint("\nERROR: No pages found in file $filename");
		$gNoPages .= "   $filename\n";
		return false;
	}

	// Keep a hash of HAR pagerefs to MySQL pageids
	$pageid = false;
	for ( $i = 0; $i < count($pages); $i++ ) {
		if ( 0 < $i ) {
			dprint("ERROR: Only one page is expected per HAR file. Page $i was found.");
			break;
		}
		$page = $pages[$i];
		$now = time();
		$aTuples = array();
		$pageref = $page->{ 'id' };

		// Add all the insert tuples to an array.
		array_push($aTuples, "createDate = $now");
		array_push($aTuples, "harfile = '$filename'");
		$startedDateTime = strtotime($page->{ 'startedDateTime' });
		array_push($aTuples, "startedDateTime = $startedDateTime");
		array_push($aTuples, "archive = '" . mysqlEscape($archive) . "'");
		if ( $label ) {
			array_push($aTuples, "label = '" . mysqlEscape($label) . "'");
		}
		$title = mysqlEscape($page->{ 'title' });
		array_push($aTuples, "title = '$title'");

		$pageTimings = $page->{ 'pageTimings' };
		$renderStart = $pageTimings->{ '_renderStart' };
		$onContentLoaded = $pageTimings->{ 'onContentLoad' };
		$onLoad = $pageTimings->{ 'onLoad' };
		if ( $renderStart && 0 < $renderStart ) {
			array_push($aTuples, "renderStart = $renderStart");
		}
		if ( $onContentLoaded && 0 < $onContentLoaded ) {
			array_push($aTuples, "onContentLoaded = $onContentLoaded");
		}
		if ( $onLoad && 0 < $onLoad ) {
			array_push($aTuples, "onLoad = $onLoad");
		}

		// Page Speed score
		$output = array();
		$return_var = 128;
		exec("./har_to_pagespeed '$filename' 2>/dev/null", $output, $return_var);
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
		if ( $pageid ) {
			$hPagerefs[$pageref] = $pageid;
		}
	}

	return $pageid;
}


// Import the requests within a website.
function importEntries($entries, $hPagerefs, &$hPageidUrls, &$hPageidUrlsHtml) {
	global $gPagesTable, $gRequestsTable;
	global $ghReqHeaders, $ghRespHeaders;
	global $ghReqOtherHeaders, $ghRespOtherHeaders;

	for ( $i = 0; $i < count($entries); $i++ ) {
		$entry = $entries[$i];
		$aTuples = array();
		$pageref = $entry->{ 'pageref' };
		if ( ! array_key_exists($pageref, $hPagerefs) ) {
			dprint("ERROR: The entry's pageref (\"$pageref\") wasn't found.");
			continue;
		}
		$pageid = $hPagerefs[$pageref];
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
		if ( ! array_key_exists($pageid, $hPageidUrls) ) {
			if ( 400 <= $status && $status <= 499 ) {
				dprint("ERROR: The first request ($url) failed with status $status.");
				return false;
			}
			// This is the first URL found associated with the page - assume it's the base URL.
			$bFirstReq = 1;
			$hPageidUrls[$pageid] = $url;
		}
		if ( ! array_key_exists($pageid, $hPageidUrlsHtml) && 200 == $status ) {
			// This is the first URL found associated with the page that's HTML.
			$bFirstHtml = 1;
			$hPageidUrlsHtml[$pageid] = $url;
		}
		array_push($aTuples, "firstReq = $bFirstReq");
		array_push($aTuples, "firstHtml = $bFirstHtml");

		$cmd = "replace into $gRequestsTable set " . implode(", ", $aTuples) . ";";
		//dprint("$cmd");
		doSimpleCommand($cmd);
	}
}


// Collect all the aggregate stats for a single website.
function aggregateStats($hPagerefs, $hPageidUrls, $hPageidUrlsHtml) {
	global $gPagesTable, $gRequestsTable;

	$aPageids = array_values($hPagerefs);
	$url = "";
	for ( $p = 0; $p < count($aPageids); $p++ ) {
		$pageid = $aPageids[$p];
		if ( 0 < $p ) {
			dprint("ERROR: Only one page is expected per HAR file. Page $p with pageid $pageid was found.");
			break;
		}

		$reqTotal = doSimpleQuery("select count(*) from $gRequestsTable where pageid = $pageid;");
		$reqHtml = doSimpleQuery("select count(*) from $gRequestsTable where pageid = $pageid and mimeType like '%html%';");
		$reqJS = doSimpleQuery("select count(*) from $gRequestsTable where pageid = $pageid and mimeType like '%script%';");
		$reqCSS = doSimpleQuery("select count(*) from $gRequestsTable where pageid = $pageid and mimeType like '%css%';");
		$reqImg = doSimpleQuery("select count(*) from $gRequestsTable where pageid = $pageid and mimeType like '%image%';");
		$reqFlash = doSimpleQuery("select count(*) from $gRequestsTable where pageid = $pageid and mimeType like '%flash%';");
		$reqOther = $reqTotal - ($reqHtml + $reqJS + $reqCSS + $reqImg + $reqFlash);

		$bytesTotal = doSimpleQuery("select sum(respSize) from $gRequestsTable where pageid = $pageid;");
		if ( ! $bytesTotal ) $bytesTotal = 0;
		$bytesHtml = doSimpleQuery("select sum(respSize) from $gRequestsTable where pageid = $pageid and mimeType like '%html%';");
		if ( ! $bytesHtml ) $bytesHtml = 0;
		$bytesJS = doSimpleQuery("select sum(respSize) from $gRequestsTable where pageid = $pageid and mimeType like '%script%';");
		if ( ! $bytesJS ) $bytesJS = 0;
		$bytesCSS = doSimpleQuery("select sum(respSize) from $gRequestsTable where pageid = $pageid and mimeType like '%css%';");
		if ( ! $bytesCSS ) $bytesCSS = 0;
		$bytesImg = doSimpleQuery("select sum(respSize) from $gRequestsTable where pageid = $pageid and mimeType like '%image%';");
		if ( ! $bytesImg ) $bytesImg = 0;
		$bytesFlash = doSimpleQuery("select sum(respSize) from $gRequestsTable where pageid = $pageid and mimeType like '%flash%';");
		if ( ! $bytesFlash ) $bytesFlash = 0;
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

		if ( ! array_key_exists($pageid, $hPageidUrls) ) {
			dprint("ERROR: no first URL found for pageref $pageref.");
			return false;
		}
		$url = $hPageidUrls[$pageid];
		$urlShort = substr($url, 0, 255);

		if ( ! array_key_exists($pageid, $hPageidUrlsHtml) ) {
			dprint("ERROR: no first HTML URL found for pageref $pageref.");
			return false;
		}
		$urlHtml = $hPageidUrlsHtml[$pageid];
		$urlHtmlShort = substr($urlHtml, 0, 255);
		
		$cmd = "update $gPagesTable set url = '$url', urlShort = '$urlShort', urlHtml = '$urlHtml', urlHtmlShort = '$urlHtmlShort', reqTotal = $reqTotal, reqHtml = $reqHtml, reqJS = $reqJS, reqCSS = $reqCSS, reqImg = $reqImg, reqFlash = $reqFlash, reqOther = $reqOther, bytesTotal = $bytesTotal, bytesHtml = $bytesHtml, bytesJS = $bytesJS, bytesCSS = $bytesCSS, bytesImg = $bytesImg, bytesFlash = $bytesFlash, bytesOther = $bytesOther, numDomains = $numDomains where pageid = $pageid;";
		//dprint($cmd);
		doSimpleCommand($cmd);
	}

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


// WebPagetest.org produces a "results.txt" file summarizing the results of a bulktest.
// Parse that once saving the results for each website.
function parseResultsTxt($archive, $label, &$hResultsTxt) {
	global $gPagesTable, $gRequestsTable;

	$harDir = getHarDir($archive, $label);
	$sResults = file_get_contents($harDir . "results.txt");
	if ( false === $sResults ) {
		dprint("ERROR: Failed to read results.txt file: " . $hardir . "results.txt");
		return false;
	}

	$aLines = explode("\n", $sResults);
	$aMatches = array();
	$pattern = '/([^\s]+)[\s]+([^\s]+)[\s]+([^\s]+)[\s]+([^\s]+)[\s]+([^\s]+)[\s]+([^\s]+)[\s]+([^\s]+)/';
	for ( $i = 1; $i < count($aLines); $i++ ) {
		$line = $aLines[$i];
		if ( $line && preg_match($pattern, $line, $aMatches) ) {
			$url = $aMatches[1];
			$wptid = $aMatches[3];
			$testresult = $aMatches[4];
			$wptrun = $aMatches[5];
			$loadTime = $aMatches[6];
			$startRender = $aMatches[7];
			$hResultsTxt[$url] = array($wptid, $testresult, $wptrun, $loadTime, $startRender);
		}
	}

	return true;
}


function usage() {
	echo "Usage: php import.php archive [label]\nThe archive and label indicate the location of the HAR files:\n   ./archives/archive/label/\n";
}

?>
