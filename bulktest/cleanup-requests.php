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
// file for each crawl.

require_once("bootstrap.inc");
require_once("../utils.inc");

$now = time();

echo exec("df -h .") . "\n";

$nUnfinished = doSimpleQuery("select count(*) from crawls where finishedDateTime is null;");
if ( 0 < $nUnfinished ) {
	cprint("SORRY! There is an unfinished crawl. Skipping the cleanup while the crawl is running.");
	exit(1);
}

cleanupRequests("requestsdev");
cleanupRequests("requests");
cleanupRequests("requestsmobiledev");
cleanupRequests("requestsmobile");

echo "DONE\n\n";

function cleanupRequests($table) {
	global $lastCrawl;

	// Actually delete rows and optimize the table.
	$cmd = "TRUNCATE TABLE $table;";
	cprint("$cmd");
	doSimpleCommand($cmd);
	cprint("Optimize table \"$table\"...");
	doSimpleCommand("optimize table $table;");
	cprint("Done with table \"$table\".");

	echo exec("df -h .") . "\n";
}

?>
