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

/* 
DESCRIPTION: The list of URLs to crawl is not based on real world URLs.
For example, http://www.twitter.com/ will redirect to http://twitter.com/.
We want to pick the most typical real world URL and use that in our crawl.
This script examines previous tests and determines the best URL to crawl.
*/

require_once("utils.inc");

//doSimpleCommand("update $gUrlsTable set url=null where urlid < 200;"); // CVSNO

$result = doQuery("select urlid, domain, rank from $gUrlsTable where url is null;");
$xtotal = $xdiff = $x300 = $xfixed = $xnotfixed = 0; // CVSNO
$stotal = $sdiff = $s300 = $sfixed = $snotfixed = ""; // CVSNO
while ($row = mysql_fetch_assoc($result)) {
	/*
	if ( $xtotal >= 100 ) {
		break; // CVSNO
	}
	*/
	$xtotal++;

	$urlid = $row['urlid'];
	$domain = $row['domain'];
	$rank = $row['rank'];
	$urlDerived = "http://www." . $domain . "/";  // This MUST be the URL we tried the very first time.

	// Get the most recent result from HTTP Archive for this URL.
	$row = doRowQuery("select pageid, urlHtml from $gPagesTable where url='$urlDerived' order by pageid desc limit 1;");
	if ( ! $row ) {
		// This is the first time for this URL. 
		// We'll have to clean it up next time.
		continue;
	}
	$pageid = $row['pageid'];
	$urlHtml = $row['urlHtml'];

	if ( $urlDerived != $urlHtml ) {
		$xdiff++; // CVSNO
		// Get more info about the initial URL.
		$row = doRowQuery("select requestid, status, resp_location, resp_cache_control, resp_expires from $gRequestsTable where pageid=$pageid and url='$urlDerived' order by requestid asc limit 1;");
		$requestid = $row['requestid'];
		$status = $row['status'];
		$resp_cache_control = $row['resp_cache_control'];
		$resp_expires = $row['resp_expires'];
		$resp_location = $row['resp_location'];
		if ( 0 === strpos($resp_location, "/") ) {
			// relative location
			$resp_location = $urlDerived + strstr($resp_location, 1);
		}

		if ( 301 == $status || 302 == $status ) { 
			$x300++; // CVSNO

			if ( false != strpos($urlHtml, "?") ) {
				// Don't store a derived URL that contains a querystring.
				$snotfixed .= "NOTFIXED (querystring): $urlDerived != $urlHtml\n";
				$xnotfixed++;
			}
			else if ( 301 == $status && $resp_location == $urlHtml && 
					  false === strpos($resp_cache_control, "no-cache") && false === strpos($resp_cache_control, "max-age=0") ) {
				// 301s that are not explicitly UNcacheable are saved.
				$xfixed++;
				$sfixed .= "FIXED: $urlDerived => $urlHtml\n";
				$urlDerived = $urlHtml;
			}
			else if ( 302 == $status && $resp_location == $urlHtml && 
					  false !== strpos($resp_cache_control, "max-age") && false === strpos($resp_cache_control, "max-age=0") ) {
				// 302s that are cacheable are saved.
				$xfixed++;
				$sfixed .= "FIXED: $urlDerived => $urlHtml\n";
				$urlDerived = $urlHtml;
			}
			else {
				$snotfixed .= "NOTFIXED: $urlDerived != $urlHtml\n";
				$snotfixed .= "  resp_location = $resp_location\n  status = $status\n  resp_cache_control = $resp_cache_control\n";
				$xnotfixed++;
			}
		}
	}

	doSimpleCommand("update $gUrlsTable set url='$urlDerived' where urlid=$urlid;");
}
mysql_free_result($result);

echo <<<OUTPUT
xtotal = $xtotal
xdiff = $xdiff
x300 = $x300
xfixed = $xfixed
xnotfixed = $xnotfixed

OUTPUT;

echo "DONE\n";




		/*
		if ( str_replace("www.", "", $urlDerived) == $urlHtml ) {
			echo "remove www.\n";
			$bUpdate = true;
		}
		else if ( str_replace("http", "https", $urlDerived) == $urlHtml ) {
			echo "convert to https.\n";
			$bUpdate = true;
		}
		else if ( str_replace("www.", "", str_replace("http", "https", $urlDerived)) == $urlHtml ) {
			echo "convert to https AND remove www.\n";
			$bUpdate = true;
		}
		else {
			echo "they're different: $urlHtml\n";
		}
		*/

?>
