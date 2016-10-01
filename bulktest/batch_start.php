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
require_once("../dbapi.inc");
require_once("../crawls.inc");
require_once("../status.inc");
require_once("batch_lib.inc");
require_once("bootstrap.inc");

////////////////////////////////////////////////////////////////////////////////
//
// Start a new run
//
////////////////////////////////////////////////////////////////////////////////

$gNumUrls = 0;
$gUrlsFile = null;
$gbUrlsFileSpecified = 0;
$gSublabel = "";
$gbImportUrls = ( $gbDev ? 1 : 0 );
$gLocation = "";
$startedDateTime = time();

parseParams();

// do NOT start a new crawl if the current crawl is still running.
$latestCrawl = latestCrawl(null, null, false);
if ( $latestCrawl && ! $latestCrawl['finishedDateTime'] ) {
	lprint("Can not start a new crawl because the latest crawl (\"{$latestCrawl['label']}\") has not finished.");
	cprint("Can not start a new crawl because the latest crawl (\"{$latestCrawl['label']}\") has not finished.");
	exit();
}

createTables();        // Create all the tables if they are not there.


// Update the list of URLs from Alexa:
if ( $gbImportUrls ) {
	// TODO - Should we do this for $gbMobile too?????
	require_once("importurls.php");

	if ( ! $gbMobile && ( $gPagesTableDesktop != $gPagesTableDev ) ) {
		lprint("Copy 'urls' rows to production");
		cprint("Copy 'urls' rows to production");
		// We have to do this immediately BEFORE the mobile crawl kicks off.
		// This is scary but the issue is we need to clear out all the previous ranks, optouts, others, etc. and use what's in urlsdev.
		for ( $i = 0; $i <= 70000; $i += 1000 ) {
			$cmd = "delete from $gUrlsTableDesktop where urlhash <= $i;";
			cprint("About to delete urls: $cmd");
			doSimpleCommand($cmd);
		}
		$cmd = "insert into $gUrlsTableDesktop select * from $gUrlsTableDev;";
		cprint("About to copy urls: $cmd");
		doSimpleCommand($cmd);
		lprint("done.");
		cprint("done.");
	}
}


// Empty the status table
lprint("Clear status table...");
cprint("Clear status table...");
removeAllStatusData();

// START THE CRAWL
// create a partial crawl record - we'll fill out the missing fields as we get them
// WARNING: Two runs submitted on the same day will have the same label.
$date = getdate();
$label = substr($date['month'], 0, 3) . " " . $date['mday'] . " " . $date['year'] . $gSublabel;
createCrawl(array(
				  "label" => $label,
				  "archive" => $gArchive,
				  "location" => $locations[0],
				  "video" => $video,
				  "docComplete" => $docComplete,
				  "fvonly" => $fvonly,
				  "runs" => $runs,
				  "startedDateTime" => $startedDateTime,
				  "passes" => 0
				  ));
$crawl = getCrawl($label, $gArchive, $locations[0]);
$crawlid = $crawl['crawlid'];
lprint("Created crawl $crawlid.");
cprint("Created crawl $crawlid.");

lprint("Load URLs...");
cprint("Load URLs...");
if ( $gUrlsFile && $gbUrlsFileSpecified ) {  // we set $gUrlsFile in importurls.php, so need a boolean to indicate if it was specified
	loadUrlsFromFile($crawlid, $label, $gUrlsFile);
}
else if ( $gNumUrls ) {
	loadUrlsFromDb($crawlid, $label, $gNumUrls, false);
}
else if ( $gbMobile ) {
	loadUrlsFromDB($crawlid, $label, 500000, false);
}
else if ( $gbDev ) {
	loadUrlsFromDB($crawlid, $label, 500000, true); // THIS IS THE ONLY CRAWL THAT UPDATES THE URLS!
}

$numUrls = doSimpleQuery("select count(*) from $gStatusTable where crawlid=$crawlid;");
updateCrawlFromId($crawlid, array( "numUrls" => $numUrls ));
lprint("done.");
cprint("done.");

lprint("DONE submitting batch run");
cprint("DONE submitting batch run");






// Load the URLs in urls.txt file into status table.
function loadUrlsFromFile($crawlid, $label, $file=NULL) {
	$file = ( $file ? $file : ($gbMobile ? './urls.1000' : './urls.txt') );
	$urls = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

	foreach( $urls as $url ) {
		$url = trim($url);
		if( strlen($url) ) {
			loadUrl($crawlid, $label, $url);
		}
	}
}


// Load the URLs in urls.txt file into status table.
function loadUrlsFromDB($crawlid, $label, $numUrls, $bOther=false) {
	global $gUrlsTable;
	$query = "select urlOrig, urlFixed, rank from $gUrlsTable where (rank <= $numUrls" . ( $bOther ? " OR other=true" : "" ) . ")" .
		" and optout=false order by rank asc;";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$urlOrig = $row['urlOrig'];
		$urlFixed = $row['urlFixed'];
		loadUrl($crawlid, $label, ( $urlFixed ? $urlFixed : $urlOrig ), $row['rank']);
	}
}



// Submit the specified URL to all the locations.
function loadUrl($crawlid, $label, $url, $rank=NULL) {
	global $locations;

	foreach ( $locations as $location ) {
		addStatusData($url, $location, $crawlid, $label, $rank);
	}
}


function parseParams() {
	global $argv, $argc, $gSublabel, $gbImportUrls, $locations, $gUrlsFile, $gNumUrls, $gbUrlsFileSpecified;
	
	// if there are any options they MUST be in this order:
	//   # of URLs or URL file
	//   location
	//   1 or 0 for whether to import URLs
	//   sublabel
	for ( $i = 1; $i < $argc; $i++ ) {
		$val = $argv[$i];
		if ( 1 === $i ) {
			// # of URLs or URL file
			if ( file_exists($val) ) {
				$gUrlsFile = $val;
				$gbUrlsFileSpecified = 1;
				$gbImportUrls = false;
			}
			else if ( 0 < intval($val) && $val === "" . intval($val) ) {
				$gNumUrls = $val;
			}
			else {
				cprint("ERROR: Unexpected value for 'numurls|urlfile' parameter: $val");
				exit();
			}
		}
		else if ( 2 === $i ) {
			$locations = array($val);
		}
		else if ( 3 === $i ) {
			if ( "1" === $argv[3] ) {
				$gbImportUrls = ( $gbUrlsFileSpecified ? false : true );   // If the list of URLs is specified in a file, we DON'T want to import the Alexa list.
			}
			else if ( "0" === $argv[3] ) {
				$gbImportUrls = false;
			}
			else {
				cprint("ERROR: Unexpected value for importUrls: '" . $argv[3] . "'.");
				exit();
			}
		}
		else if ( 4 === $i ) {
			// sublabel 
			$gSublabel = $val;
		}
	}
}

?>
