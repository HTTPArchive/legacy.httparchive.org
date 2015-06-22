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
require_once("batch_lib.inc");
require_once("bootstrap.inc");


// Find all the current UNCOMPLETED crawls.
$query = "select * from $gCrawlsTable where finishedDateTime is null;";
$result = doQuery($query);
if ( isEmptyQuery($result) ) {
	exit();
}

// Check each current crawl.
$gPerDone = 20;   // percentage of URLs completed to consider the crawl far enough to evaluate for errors
$gPerFailed = 10; // acceptable failure rate
$gFirstDays = 10; // max days to finish the first pass
$gTotalDays = 13; // max days to finish the crawl

while ( $crawl = mysql_fetch_assoc($result) ) {
	// Find the DB table suffix that corresponds to this crawl.
	$location = $crawl['location'];
	$suffix = ( "California:Chrome.3G" === $location ? "android" :
				( "California:Chrome" === $location ? "chrome" :
				  ( "iphone4" === $location ? "mobile" : "dev" ) ) );

	$statusTable = "status" . $suffix;
	$totalUrls = countTestsWithCode(-1, $statusTable);
	$successfulTests = countTestsWithCode(DONE, $statusTable);
	$failedTests = countFailedTests($statusTable);
	$done = $successfulTests + $failedTests;

	$sProblems = "";
	// If we're far enough into the crawl and the error rate is high.
	$perDone = round( 100 * $done / $totalUrls );
	$perFailed = round( 100 * $failedTests / $done );
	if ( $gPerDone < $perDone && $gPerFailed < $perFailed ) {
		$sProblems .= "    WARNING: Failure rate too high: $perDone% URLs completed with $perFailed% failed (threshold set at $gPerFailed%).\n";
	}

	// If we have not finished first pass in 10 days. 
	$secondsSoFar = time() - $crawl['startedDateTime'];
	$daysSoFar = number_format($secondsSoFar/(24*60*60), 1);
	if ( 0 === $crawl['passes'] && $gFirstDays < $daysSoFar ) {
		$sProblems .= "    WARNING: First pass is taking more than $gFirstDays days (currently $daysSoFar days).\n";
	}

	if ( $gTotalDays < $daysSoFar ) {
		$sProblems .= "    WARNING: Crawl is taking more than $gTotalDays days (currently $daysSoFar days).\n";
	}

	// Display errors (if any).
	if ( $sProblems ) {
		echo "Problems with crawl #{$crawl['crawlid']} \"{$crawl['label']} - $suffix\":\n$sProblems\n";
	}
}
?>
