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

	$query = "select urlOrig from $gUrlsTable where (urlFixed='$url' or urlOrig='$url') order by rank asc;";
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

	$query = "select rank from $gUrlsTable where urlFixed='$url' or urlOrig='$url' order by rank asc;";
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


function removeUrlData($url) {
	global $gPagesTable, $gRequestsTable;
	// TODO
}


function optoutUrl($url) {
	global $gUrlsTable;

	$cmd = "update $gUrlsTable set optout=true where urlOrig='$url' or urlFixed='$url';";
	doSimpleCommand($cmd);
}


?>
