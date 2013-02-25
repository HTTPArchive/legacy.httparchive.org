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



// mysqldump file
// pages
$pagesTable = ( $gbMobile ? $gPagesTableMobile : $gPagesTableDesktop );
$dumpfile = dumpfileName($gLabel, "pages");
$cmd = "mysqldump --where='$pageidCond' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $pagesTable | gzip > $dumpfile.gz";
exec($cmd);
lprint("...mysqldump file created: $dumpfile.gz");

// pages csv
// Unique dir for this dump cuz mysqldump writes files that aren't writable by this process, and mysqldump -T can NOT overwrite existing files.
$labelUnderscore = str_replace(" ", "_", $gLabel);
$tmpdir = "/tmp/$labelUnderscore." . time();
$cmd = "mkdir $tmpdir; chmod 777 $tmpdir;";
exec($cmd);
$dumpfile = dumpfileName($gLabel, "pages", "csv");
$cmd = "mysqldump --where='$pageidCond' -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer -T $tmpdir --fields-enclosed-by=\\\" --fields-terminated-by=, $gMysqlDb $pagesTable; " .
	"gzip -f -c $tmpdir/$pagesTable.txt > $dumpfile.gz";
exec($cmd);
lprint("...mysqldump file created: $dumpfile.gz");

// requests
$requestsTable = ( $gbMobile ? $gRequestsTableMobile : $gRequestsTableDesktop );
$dumpfile = dumpfileName($gLabel, "requests");
$cmd = "mysqldump --where='$pageidCond' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $requestsTable | gzip > $dumpfile.gz";
exec($cmd);
lprint("...mysqldump file created: $dumpfile.gz");

// requests csv
$dumpfile = dumpfileName($gLabel, "requests", "csv");
$cmd = "mysqldump --where='$pageidCond' -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer -T $tmpdir --fields-enclosed-by=\\\" --fields-terminated-by=, $gMysqlDb $requestsTable; " .
	"gzip -f -c $tmpdir/$requestsTable.txt > $dumpfile.gz";
exec($cmd);
lprint("...mysqldump file created: $dumpfile.gz");
exec("/bin/rm -rf $tmpdir"); // remove the temporary directory - it's BIG!


// stats mysql dump - create this after all crawls both desktop & mobile
$dumpfile = "../downloads/httparchive_stats";
lprint("Creating mysqldump file $dumpfile ...");
$cmd = "mysqldump --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gStatsTableDesktop | gzip > $dumpfile.gz";
exec($cmd);
lprint("...mysqldump file created: $dumpfile.gz");

// crawls mysql dump
$dumpfile = "../downloads/httparchive_crawls";
lprint("Creating mysqldump file $dumpfile ...");
$cmd = "mysqldump --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gCrawlsTable | gzip > $dumpfile.gz";
exec($cmd);
lprint("...mysqldump file created: $dumpfile.gz");

// schema & urls dumps - only create these for desktop
if ( ! $gbMobile ) {
	// schema mysql dump
	$dumpfile = "../downloads/httparchive_schema.sql";
	lprint("Creating mysqldump file $dumpfile ...");
	$cmd = "mysqldump --no-data --skip-add-drop-table -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gStatsTableDesktop $gRequestsTableDesktop $gPagesTableDesktop $gRequestsTableMobile $gPagesTableMobile $gCrawlsTable > $dumpfile";
	exec($cmd);
	lprint("...mysqldump file created: $dumpfile");

	// urls mysql dump
	$dumpfile = "../downloads/httparchive_urls";
	lprint("Creating mysqldump file $dumpfile ...");
	$cmd = "mysqldump --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gUrlsTableDesktop | gzip > $dumpfile.gz";
	exec($cmd);
	lprint("...mysqldump file created: $dumpfile.gz");
}


cprint(date("G:i") . ": DONE copying latest run to production.");

?>
