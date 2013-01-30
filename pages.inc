<?php

require_once("utils.inc");
require_once("dbapi.inc");
require_once("requests.inc");


function pageFromWPT($wptid, $medianRun, $bRepeatView=false) {
	// Fetch the HAR file from WebPagetest.
	$wptServer = wptServer();
	$url = $wptServer . "export.php?test=$wptid&run=$medianRun&cached=" . ( $bRepeatView ? "1" : "0" ) . "&php=1";
	$response = file_get_contents($url);

	return pageFromHar($response);
}


// Return a page object.
// $sJson is the contents of a HAR file.
function pageFromHar($sJson) {
	if ( !$sJson ) {
		dprint("ERROR: JSON string empty.");
		return NULL;
	}

	$HAR = json_decode($sJson, true);
	if ( NULL == $HAR ) {
		dprint("ERROR: JSON decode failed.");
		return NULL;
	}

	$aPages = $HAR['log']['pages'];
	$pagecount = count($aPages);
	if ( 0 === $pagecount ) {
		dprint("ERROR: no pages in HAR.");
		return NULL;
	}

	$page = $aPages[0];

	// Copy some properties buried deep in the JSON structure to the top.
	$page['onContentLoaded'] = ( array_key_exists('onContentLoaded', $page['pageTimings']) ? $page['pageTimings']['onContentLoaded'] : NULL );
	$page['onLoad'] = $page['pageTimings']['onLoad'];
	$aResources = $HAR['log']['entries'];
	$page['url'] = $aResources[0]['request']['url']; // ASSUME the first request is for the main URL
	$page['resources'] = resourcesFromHar($aResources, $page['id']);

	return $page;
}


?>
