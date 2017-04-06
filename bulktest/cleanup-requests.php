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

// This file is currently meant to be run manually every month or so.
// The purpose is to free up disk space taken up by rows in the 
// "requests" and "requestsdev" tables. We do NOT need these rows for
// any part of the UI, and all of the requests are archived in a dump
// file for each crawl. I'm too nervous to delete the rows automatically
// as part of the crawl process. Instead, once everything looks okay,
// I run this script manually.

require_once("bootstrap.inc");
require_once("../utils.inc");

$now = time();

$gbActuallyDoit = false;
if ( array_key_exists(1, $argv) ) {
	if ( "DOIT" == $argv[1] ) {
		$gbActuallyDoit = true;
	}
	else {
		cprint("Do 'php cleanup-requests.php DOIT' to actually delete the rows.");
	}
}

$gSkipRuns = 2;  // how many runs we want to skip and leave their requests intact
echo exec("df -h .") . "\n";

cleanupRequests("IE8", "requestsie");
cleanupRequests("California:Chrome", "requestschrome");
cleanupRequests("California:Chrome", "requestsdev");
cleanupRequests("California:Chrome", "requests");

echo "DONE\n\n";

function cleanupRequests($location, $table) {
	global $gSkipRuns, $gbActuallyDoit;

	$query = "select * from crawls where location = '$location' and finishedDateTime is not null order by crawlid desc limit " . ($gSkipRuns+1) . ";";
	$results = doQuery($query);
	mysql_data_seek($results, $gSkipRuns);
	$row = mysql_fetch_assoc($results);

	// How many rows would be deleted?
	$numRows = doSimpleQuery("select count(*) from $table where crawlid <= {$row['crawlid']};");
	cprint("$numRows rows to be deleted.\n");

	if ( $gbActuallyDoit ) {
		$nUnfinished = doSimpleQuery("select count(*) from crawls where location = '$location' and finishedDateTime is null;");
		if ( 0 < $nUnfinished ) {
			cprint("SORRY! There is an unfinished crawl for location '$location'. Skipping the cleanup while the crawl is running.");
			return;
		}

		// Actually delete rows and optimize the table.
		cprint("Delete requests from \"$table\" table starting with crawl \"{$row['label']}\" crawlid={$row['crawlid']} minPageid={$row['minPageid']} maxPageid={$row['maxPageid']} and earlier...");
		$cmd = "delete from $table where crawlid <= {$row['crawlid']};";
		cprint("$cmd");
		doSimpleCommand($cmd);
		cprint("\nOptimize table \"$table\"...");
		doSimpleCommand("optimize table $table;");
		cprint("Done with table \"$table\".");
	}
	else {
		cprint("WOULD delete requests from \"$table\" table starting with crawl \"{$row['label']}\" crawlid={$row['crawlid']} minPageid={$row['minPageid']} maxPageid={$row['maxPageid']} and earlier...");
	}

	echo exec("df -h .") . "\n";
}

?>
