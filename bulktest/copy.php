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

require_once("../settings.inc");
require_once("../utils.inc");

// $gParamLabel is a hack to allow for require(copy.php)
$gLabel = ( isset($gParamLabel) ? $gParamLabel : $argv[1] );
if ( !$gLabel ) {
	lprint("You must specify a label.");
	exit();
}

// find min & max pageid of the specified run
$crawl = getCrawl($gLabel);
$minid = $crawl['minPageid'];
$maxid = $crawl['maxPageid'];
lprint("Run \"$gLabel\": min pageid = $minid, max pageid = $maxid");



// copy the rows to production
$pageidCond = "pageid >= $minid and pageid <= $maxid";
if ( ! $gbMobile && ( $gPagesTableDesktop != $gPagesTableDev ) ) {
	$count = doSimpleQuery("select count(*) from $gPagesTableDesktop where $pageidCond;");
	if ( $count ) {
		lprint("Rows already copied.");
	}
	else {
		lprint("Copy 'requests' rows to production...");
		doSimpleCommand("insert into $gRequestsTableDesktop select * from $gRequestsTableDev where $pageidCond;");

		lprint("Copy 'pages' rows to production...");
		doSimpleCommand("insert into $gPagesTableDesktop select * from $gPagesTableDev where $pageidCond;");

		lprint("...DONE.");
	}
}


// orphaned records
lprint("Checking for orphaned records...");
$numOrphans = doSimpleQuery("select count(*) from $gRequestsTable where $pageidCond and pageid not in (select pageid from $gPagesTable where $pageidCond);");
if ( $numOrphans ) {
	lprint("There are $numOrphans orphaned records in the \"$gRequestsTable\" table.");
	$cmd = "delete from $gRequestsTable where $pageidCond and pageid not in (select pageid from $gPagesTable where $pageidCond);";
	if ( $numOrphans < 5000 ) {
		lprint("Deleting orphans now...");
		doSimpleCommand($cmd);
	}
	else {
		lprint("You should delete them, recalculate the stats, and regenerate the mysql dump files.\n    $cmd");
	}
}
else {
	lprint("No orphaned records.");
}



// Compute stats
require_once("../stats.inc");
require_once("../dbapi.inc");
$device = curDevice();

if ( getStats($gLabel, "All", $device) ) {
	lprint("Stats already computed.");
}
else {
	lprint("Computing stats for $gLabel $device...");
	replaceStats($gLabel, null, $device);

	if ( ! $gbMobile && ( $gStatsTableDesktop != $gStatsTableDev ) ) {
		lprint("Copy stats to production...");
		$cmd = "replace into $gStatsTableDesktop select * from $gStatsTableDev where label='$gLabel' and device='$device';";
		doSimpleCommand($cmd);
	}
	lprint("...stats computed and copied.");
}



// mysqldump files
dumpCrawl($gLabel);
dumpOther();


cprint(date("G:i") . ": DONE copying latest run to production.");

?>
