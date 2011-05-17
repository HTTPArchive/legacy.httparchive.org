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

require_once("../utils.php");
require_once("batch_lib.inc");
require_once("bootstrap.inc");


// Load the URLs in urls.txt file into status table.
function loadUrlsFromFile($label) {
	global $locations, $gArchive;

	$urls = file('./urls.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

	foreach( $urls as $url ) {
		$url = trim($url);
		if( strlen($url) ) {
			$url = refineUrl($url);
			foreach ( $locations as $location ) {
				insertToStatusTable($url, $location, $label);
			}
		}
	}
}


// Insert a row into the status table.
function insertToStatusTable($url, $loc, $label) {
	global $gStatusTable, $gArchive;
	$now = time();
	$cmd = "REPLACE INTO $gStatusTable SET url = '" . mysql_real_escape_string($url) . 
		"' , location = '" . mysql_real_escape_string($loc) . 
		"', archive = '$gArchive', label = '$label', status = '" . NOT_STARTED . "', timeofLastChange = '$now';";
	doSimpleCommand($cmd);
}


function emptyStatusTable() {
	global $gStatusTable;
	$cmd = "TRUNCATE TABLE $gStatusTable;";
	doSimpleCommand($cmd);
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


// Start a new batch
// A file lock to guarantee there is only one instance running.
$fp = fopen($gLockFile, "w+");
if ( !flock($fp, LOCK_EX | LOCK_NB) ) {
	$pid = getPid("php batch_process.php");
	if ( 0 < $pid ) {
		killProcessAndChildren($pid);
	}
}

// Create all the tables if they are not there.
createTables();

// Report the summary of the tests
echo "PREVIOUS TEST:\n";
reportSummary();

// Empty the status table
emptyStatusTable();

// Load the next batch
// WARNING: Two runs submitted on the same day will have the same label.
$date = getdate();
$label = substr($date['month'], 0, 3) . " " . $date['mday'] . " " . $date['year'];
loadUrlsFromFile($label);

echo "DONE submitting batch run\n";
?>
