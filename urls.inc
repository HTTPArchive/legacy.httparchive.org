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

function rankUrl($url) {
	global $gUrlsTable;

	$query = "select urlOrig from $gUrlsTable where urlhash=conv(substring(md5('$url'),1,4),16,10) and (urlFixed='$url' or urlOrig='$url') order by rank asc;";
	$urlOrig = doSimpleQuery($query);

	$aMatches = array();
	$rankUrl = "http://www.alexa.com/siteinfo";
	if ( preg_match('/^http[s]*:\/\/www\.(.*)/', $urlOrig, $aMatches) ) {
		$rankUrl = "http://www.alexa.com/siteinfo/" . $aMatches[1];
	}
	else if ( preg_match('/^http[s]*:\/\/(.*)\//', $urlOrig, $aMatches) || preg_match('/^http[s]*:\/\/(.*)/', $urlOrig, $aMatches) ) {
		$rankUrl = "http://www.alexa.com/search?q=" . $aMatches[1] . "&r=site_siteinfo&p=bigtop";
	}
	else if ( preg_match('/^(htt.*)/', $urlOrig, $aMatches) ) {
		$rankUrl = "http://www.alexa.com/search?q=" . $aMatches[1] . "&r=site_siteinfo&p=bigtop";
	}

	return $rankUrl;
}


// TODO - Eventually we might want to return the rank RELATIVE to a specific pageid.
// For example, foobar.com might be rank 123 today but was 456 at the time of the run.
function rank($url, $pageid=null) {
	global $gUrlsTable;

	$query = "select rank from $gUrlsTable where urlhash=conv(substring(md5('$url'),1,4),16,10) and (urlOrig='$url') order by rank asc;";
	$rank = doSimpleQuery($query);

	return ( $rank ? $rank : "n/a" );
}


function addSite($url) {
	global $gUrlsChangeTable;

	// Add the URL to a queue for later removal.
	$cmd = "insert into $gUrlsChangeTable set url='$url', action='add', createdate = " . time() . ";";
	return doSimpleCommand($cmd);
}


function removeSite($url) {
	global $gUrlsChangeTable;

	// Add the URL to a queue for later removal.
	$cmd = "insert into $gUrlsChangeTable set url='$url', action='remove', createdate = " . time() . ";";
	return doSimpleCommand($cmd);
}


// return true if the URL is already in the list
function urlExists($url, &$other=NULL, &$optout=NULL) { 
	global $gUrlsTable;

	$query = "select urlOrig, urlFixed, other, optout from $gUrlsTable where urlOrig='$url' or urlFixed='$url';";
	$row = doRowQuery($query);
	$existingUrl = ( $row['urlFixed'] ? $row['urlFixed'] : $row['urlOrig'] );
	$other = $row['other'];
	$optout = $row['optout'];

	if ( !$existingUrl && FALSE === strpos($url, "http://www.") && FALSE === strpos($url, "https://www.") ) {
		$url = str_replace("http://", "http://www.", $url);
		$url = str_replace("https://", "https://www.", $url);
		$query = "select urlOrig, urlFixed, other, optout from $gUrlsTable where urlOrig='$url' or urlFixed='$url';";
		$row = doRowQuery($query);
		$existingUrl = ( $row['urlFixed'] ? $row['urlFixed'] : $row['urlOrig'] );
		$other = $row['other'];
		$optout = $row['optout'];
	}

	return $existingUrl;
}
 
// Returns a mysql result instance of all pending urls
function pendingUrls() {
	global $gUrlsChangeTable;
	$query = "select url, createDate, action from $gUrlsChangeTable order by action, createDate asc;";
	$result = doQuery($query);
	return ( $result ? $result : -1);
}

 
// Add a url to the urls table (and remove it from the urlschanges table).
function approveAddUrl($url) {
	global $gUrlsChangeTable;
	addOtherUrl($url);
	$cmd = "delete from $gUrlsChangeTable where url='$url';";
	doSimpleCommand($cmd);
}

 
// Remove a url from the urls table (and remove it from the urlschanges table).
function approveRemoveUrl($url) {
	global $gUrlsChangeTable;

	removeUrlData($url);

	$cmd = "delete from $gUrlsChangeTable where url='$url';";
	doSimpleCommand($cmd);
}


// Set "other=true" for a URL in the urls table.
function addOtherUrl($url) {
	global $gUrlsTable;
	$cmd = "replace into $gUrlsTable set urlOrig='$url', other=1;";
	$result = doSimpleCommand($cmd);
}


// Rejects a url in the 'add' state.
function rejectUrl($url) {
	global $gUrlsChangeTable;
	$cmd = "delete from $gUrlsChangeTable where url='$url';";
	doSimpleCommand($cmd);
}


function removeUrlData($url) {
	global $gPagesTable, $gRequestsTable, $gUrlsTable;

	// delete it from the urls table so it's no longer crawled
	$cmd = "delete from $gUrlsTable where urlOrig='$url' or urlFixed='$url';";
	doSimpleCommand($cmd);

	$result = doQuery("select pageid from $gPagesTable where url='$url';");
	$aPageids = array();
	while ( $row = mysql_fetch_assoc($result) ) {
		$aPageids[] = $row['pageid'];
	}
	mysql_free_result($result);

	$sPageids = implode(",", $aPageids);
	if ( $sPageids ) {
		$cmd = "delete from $gPagesTable where pageid in ($sPageids);";
		doSimpleCommand($cmd);
		$cmd = "delete from $gRequestsTable where pageid in ($sPageids);";
		doSimpleCommand($cmd);
	}

	// TODO - we should recompute all the stats at this point - ouch
}


function optoutUrl($url) {
	global $gUrlsTable;

	$cmd = "update $gUrlsTable set optout=true where urlOrig='$url' or urlFixed='$url';";
	doSimpleCommand($cmd);
}


?>
