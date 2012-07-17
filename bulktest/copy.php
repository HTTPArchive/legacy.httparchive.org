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

$gLabel = $argv[1];
if ( !$gLabel ) {
	echo "You must specify a label.\n";
	exit();
}



// find min & max pageid of the specified run
$row = doRowQuery("select min(pageid) as minid, max(pageid) as maxid from $gPagesTable where label='$gLabel';");
$minid = $row['minid'];
$maxid = $row['maxid'];
echo "Run \"$gLabel\": min pageid = $minid, max pageid = $maxid\n";



// copy the rows to production
if ( ! $gbMobile && ( $gPagesTableDesktop != $gPagesTableDev ) ) {
	$count = doSimpleQuery("select count(*) from $gPagesTableDesktop where pageid >= $minid and pageid <= $maxid;");
	if ( $count ) {
		echo "Rows already copied.\n";
	}
	else {
		echo "Copy 'requests' rows to production...\n";
		doSimpleCommand("insert into $gRequestsTableDesktop select * from $gRequestsTableDev where pageid >= $minid and pageid <= $maxid;");

		echo "Copy 'pages' rows to production...\n";
		doSimpleCommand("insert into $gPagesTableDesktop select * from $gPagesTableDev where pageid >= $minid and pageid <= $maxid;");

		// TODO - should we do this for $gbMobile too???
		echo "Copy 'urls' rows to production...\n";
		// This is scary but the issue is we need to clear out all the previous ranks, optouts, others, etc. and use what's in urlsdev.
		doSimpleCommand("delete from $gUrlsTableDesktop;");
		doSimpleCommand("insert into $gUrlsTableDesktop select * from $gUrlsTableDev;");

		echo "...DONE.\n";
	}
}



// Compute stats
require_once("../stats.inc");
require_once("../dbapi.inc");
$device = ( $gbMobile ? "iphone" : "IE8" );

if ( getStats($gLabel, "All", $device) ) {
	echo "Stats already computed.\n";
}
else {
	echo "Computing stats...\n";

	// remove any incomplete cache data that might have been created during the crawl
	removeStats($gLabel, NULL, $device);

	computeMissingStats($device, true);

	if ( ! $gbMobile && ( $gStatsTableDesktop != $gStatsTableDev ) ) {
		echo "Copy stats to production...\n";
		$cmd = "replace into $gStatsTableDesktop select * from $gStatsTableDev where device='IE8';";
		doSimpleCommand($cmd);
	}
	echo "...stats computed and copied.\n";
}



// mysqldump file
$dumpfile = "../downloads/httparchive_" . ( $gbMobile ? "mobile_" : "" ) . str_replace(" ", "_", $gLabel);
if ( file_exists("$dumpfile.gz") ) {
	echo "Mysqldump file \"$dumpfile\" already exists.\n";
}
else {
	echo "Creating mysqldump file $dumpfile ...\n";
	if ( $gbMobile ) {
		$cmd = "mysqldump --where='pageid >= $minid and pageid <= $maxid' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gRequestsTableMobile $gPagesTableMobile | gzip > $dumpfile.gz";
	}
	else {
		$cmd = "mysqldump --where='pageid >= $minid and pageid <= $maxid' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gRequestsTableDesktop $gPagesTableDesktop | gzip > $dumpfile.gz";
	}
	exec($cmd);

	echo "...mysqldump file created: $dumpfile\n";
}



// stats mysql dump
$dumpfile = "../downloads/httparchive_stats";
echo "Creating mysqldump file $dumpfile ...\n";
$cmd = "mysqldump --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gStatsTableDesktop > $dumpfile";
exec($cmd);
exec("gzip -f $dumpfile");
echo "...mysqldump file created: $dumpfile\n";



// schema mysql dump
$dumpfile = "../downloads/httparchive_schema.sql";
echo "Creating mysqldump file $dumpfile ...\n";
$cmd = "mysqldump --no-data --skip-add-drop-table -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gStatsTableDesktop $gRequestsTableDesktop $gPagesTableDesktop $gRequestsTableMobile $gPagesTableMobile > $dumpfile";
exec($cmd);
echo "...mysqldump file created: $dumpfile\n";



echo "DONE copying latest run to production.\n";
