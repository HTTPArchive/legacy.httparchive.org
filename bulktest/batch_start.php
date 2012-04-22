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

require_once("../utils.inc");
require_once("../dbapi.inc");
require_once("batch_lib.inc");
require_once("bootstrap.inc");


// Load the URLs in urls.txt file into status table.
function loadUrlsFromFile($label, $file=NULL) {
	$file = ( $file ? $file : ($gbMobile ? './urls.1000' : './urls.txt') );
	$urls = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

	foreach( $urls as $url ) {
		$url = trim($url);
		if( strlen($url) ) {
			loadUrl($label, $url);
		}
	}
}


// Load the URLs in urls.txt file into status table.
function loadUrlsFromDB($label, $numUrls, $bOther=false) {
	global $gUrlsTable;

	$query = "select urlOrig, urlFixed, rank from $gUrlsTable where (rank <= $numUrls" . ( $bOther ? " OR other=true" : "" ) . ")" .
		" and optout=false order by rank asc;";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$urlOrig = $row['urlOrig'];
		$urlFixed = $row['urlFixed'];
		loadUrl($label, ( $urlFixed ? $urlFixed : $urlOrig ), $row['rank']);
	}
}



// Submit the specified URL to all the locations.
function loadUrl($label, $url, $rank=NULL) {
	global $locations;

	foreach ( $locations as $location ) {
		addStatusData($url, $location, $label, $rank);
	}
}


////////////////////////////////////////////////////////////////////////////////
//
// Start a new batch
//
////////////////////////////////////////////////////////////////////////////////

// A file lock to guarantee there is only one instance running.
$fp = fopen(lockFilename($locations[0], "ALL"), "w+");

if ( !flock($fp, LOCK_EX | LOCK_NB) ) {
	$pid = getPid("php batch_process.php");
	if ( 0 < $pid ) {
		echo "There's already a batch_process.php process running: $pid\nYou'll have to edit batch_start.php or kill that process yourself.\n";
		exit();
		// TODO - I guess the previous logic was to kill batch_process if batch_start was ever called.
		// That scares me. It's too easy to type the wrong thing.
		// killProcessAndChildren($pid);
	}
}

// Create all the tables if they are not there.
createTables();

// remove log file
unlink("batch.log");

// Update the list of URLs from Alexa:
if ( ! $gbMobile ) {
	// TODO - Should we do this for $gbMobile too?????
	require_once("importurls.php");
}

// Empty the status table
removeAllStatusData();

// Load the next batch
// WARNING: Two runs submitted on the same day will have the same label.
$date = getdate();
$label = substr($date['month'], 0, 3) . " " . $date['mday'] . " " . $date['year'];

if ( $gbMobile ) {
	loadUrlsFromDB($label, 2000);
}
else {
	loadUrlsFromDB($label, 200000, true);
}

echo "DONE submitting batch run\n";
?>
