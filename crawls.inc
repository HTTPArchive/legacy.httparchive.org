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

require_once("utils.inc");
require_once("dbapi.inc");

////////////////////////////////////////////////////////////////////////////////
//
// CRAWLS - meta-information about each crawl (AKA "run")
//
////////////////////////////////////////////////////////////////////////////////

// Return a hash corresponding to the specified crawl. Return FALSE if not found.
function getCrawl($label, $archive=null, $location=null) {
	global $gArchive;
	$archive = ( $archive ? $archive : $gArchive );
	$location = ( $location ? $location : curDevice() );
	$crawlsTable = crawlsTable();

	$query = "select * from $crawlsTable where label = '$label' and archive = '$archive' and location = '$location';";
	return doRowQuery($query);
}


function createCrawl($hTuples) {
	$crawlsTable = crawlsTable();
	$now = time();
	$cmd = "insert into $crawlsTable set " . hashImplode(", ", "=", $hTuples) . ", timeOfLastChange = $now;";
	doSimpleCommand($cmd);
	return true;
}


function updateCrawl($label, $archive, $location, $hTuples) {
	$crawlsTable = crawlsTable();
	$now = time();
	$cmd = "update $crawlsTable set " . hashImplode(", ", "=", $hTuples) . ", timeOfLastChange = $now where label='$label' and archive='$archive' and location='$location';";
	doSimpleCommand($cmd);
	return true;
}


// increment the number of passes for this crawl
// return the resulting number of passes
function crawlPasses($label, $archive, $location) {
	$crawlsTable = crawlsTable();
	return doSimpleQuery("select passes from $crawlsTable where label='$label' and location='$location';");
}


// return the label PRIOR to the current label
function getPrevLabel($label, $archive, $location, $delta=0) {
	$crawlsTable = crawlsTable();
	$query = "select label from $crawlsTable where startedDateTime < ((select startedDateTime from $crawlsTable where label='$label' and archive='$archive' and location='$location')-$delta) order by startedDateTime desc limit 1;";
	return doSimpleQuery($query);
}


// DO NOT USE THESE GLOBAL  VARIABLES!
// These are PRIVATE variables. They should be accessed by the corresponding function.
$p_MinLabel = $p_MaxLabel = null;

// Return a label from 1 year ago or from querystring.
function minLabel() {
	global $p_MinLabel;
	if ( null === $p_MinLabel ) {
		$p_MinLabel = getParam("minlabel", latestLabel(null, time()-(365*24*60*60)));
	}
	return $p_MinLabel;
}


// Return the most recent label or from querystring.
function maxLabel() {
	global $p_MaxLabel, $gArchive;
	if ( null === $p_MaxLabel ) {
		$p_MaxLabel = getParam("maxlabel", latestLabel($gArchive));
	}
	return $p_MaxLabel;
}


// Return an array of label names (in chrono order?) for an archive.
// If $bEpoch is true return labels based on 
function archiveLabels($archive=null, $bEpoch = false, $format = "n/j/y", $bAll=false) {
	global $gCrawlsTable, $gArchive;
	if ( ! $archive ) {
		$archive = $gArchive;
	}
	$dateRange = dateRangeCrawls($bAll);
	$device = curDevice();

	// CVSNO - use the crawls table
	$query = "select label, startedDateTime as epoch from $gCrawlsTable where $dateRange and archive = '$archive' and location='$device' order by epoch asc;";
	$result = doQuery($query);

	$aLabels = array();
	while ($row = mysql_fetch_assoc($result)) {
		$label = $row['label'];
		$epoch = $row['epoch'];
		if ( $bEpoch ) {
			array_push($aLabels, gmdate($format, $epoch));
		}
		else {
			array_push($aLabels, $label);
		}
	}
	mysql_free_result($result);

	return $aLabels;
}


// return the archive for a given label
function getArchive($label) {
	global $gPagesTable;

	return doSimpleQuery("select archive from $gPagesTable where label = '$label' limit 1;");
}


// Return the latest (most recent) crawl for an archive 
// based on when the pages in that crawl were analyzed.
function latestCrawl($archive=null, $beforeEpoch=null) {
	global $gArchive;
	$archive = ( $archive ? $archive : $gArchive );
	$device = curDevice();

	$query = "select * from " . crawlsTable() . " where finishedDateTime is not null and archive = '$archive' and location='$device'" .
		( $beforeEpoch ? " and startedDateTime <= $beforeEpoch" : "" ) .
		" order by startedDateTime desc limit 1;";
	$crawl = doRowQuery($query);

	return $crawl;
}


// Return the latest (most recent) label for an archive 
// based on when the pages in that label were analyzed.
function latestLabel($archive=null, $beforeEpoch=null) {
	global $gArchive;
	$archive = ( $archive ? $archive : $gArchive );
	$device = curDevice();

	$query = "select label from " . crawlsTable() . " where finishedDateTime is not null and archive = '$archive' and location='$device'" .
		( $beforeEpoch ? " and startedDateTime <= $beforeEpoch" : "" ) .
		" order by startedDateTime desc limit 1;";
	$label = doSimpleQuery($query);

	return $label;
}


function labelMinid($label) {
	$crawl = getCrawl($label);
	return $crawl['minPageid'];
}


function labelMaxid($label) {
	$crawl = getCrawl($label);
	return $crawl['maxPageid'];
}


// Return a random pageid from the crawl.
function randomPageid($crawl) {
	// a random offset into the number of pages
	$offset = rand(0, $crawl['numPages']-1);

	// order the pages and then offset into the list to the random page
	$query = "select pageid from pages where pageid >= {$crawl['minPageid']} and pageid <= {$crawl['maxPageid']} order by pageid asc limit $offset, 1;";
	return doSimpleQuery($query);
}


////////////////////////////////////////////////////////////////////////////////
// 
// BATCH PROCESSING CODE
//
////////////////////////////////////////////////////////////////////////////////

// Create the Mysql dump files for a crawl.
// TODO: This code assumes that ../downloads/ exists. Instead, it should be able to find the download directory.
function dumpCrawl($label, $archive=null, $location=null) {
	global $gbMobile, $gPagesTableMobile, $gPagesTableDesktop, $gRequestsTableMobile, $gRequestsTableDesktop, $gStatsTableDesktop, $gCrawlsTable, $gUrlsTableDesktop;
	global $gMysqlUsername, $gMysqlPassword, $gMysqlServer, $gMysqlDb;

	$crawl = getCrawl($label, $archive, $location);
	$minid = $crawl['minPageid'];
	$maxid = $crawl['maxPageid'];
	$pageidCond = "pageid >= $minid and pageid <= $maxid";

	// pages
	// We have to EXPLICITLY specify the Desktop table because we do NOT want the dump file to point to a DEV table.
	$pagesTable = ( $gbMobile ? $gPagesTableMobile : $gPagesTableDesktop );
	$dumpfile = dumpfileName($label, "pages");
	$cmd = "mysqldump --where='$pageidCond' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $pagesTable | gzip > $dumpfile.gz";
	exec($cmd);
	lprint("...mysqldump file created: $dumpfile.gz");

	// pages csv
	// Unique dir for this dump cuz mysqldump writes files that aren't writable by this process, and mysqldump -T can NOT overwrite existing files.
	$labelUnderscore = str_replace(" ", "_", $label);
	$tmpdir = "/tmp/$labelUnderscore." . time();
	$cmd = "mkdir $tmpdir; chmod 777 $tmpdir;";
	exec($cmd);
	$dumpfile = dumpfileName($label, "pages", "csv");
	$cmd = "mysqldump --where='$pageidCond' -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer -T $tmpdir --fields-enclosed-by=\\\" --fields-terminated-by=, $gMysqlDb $pagesTable; " .
		"gzip -f -c $tmpdir/$pagesTable.txt > $dumpfile.gz";
	exec($cmd);
	lprint("...mysqldump file created: $dumpfile.gz");

	// requests
	$requestsTable = ( $gbMobile ? $gRequestsTableMobile : $gRequestsTableDesktop );
	$dumpfile = dumpfileName($label, "requests");
	$cmd = "mysqldump --where='$pageidCond' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $requestsTable | gzip > $dumpfile.gz";
	exec($cmd);
	lprint("...mysqldump file created: $dumpfile.gz");

	// requests csv
	$dumpfile = dumpfileName($label, "requests", "csv");
	$cmd = "mysqldump --where='$pageidCond' -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer -T $tmpdir --fields-enclosed-by=\\\" --fields-terminated-by=, $gMysqlDb $requestsTable; " .
		"gzip -f -c $tmpdir/$requestsTable.txt > $dumpfile.gz";
	exec($cmd);
	lprint("...mysqldump file created: $dumpfile.gz");
	exec("/bin/rm -rf $tmpdir"); // remove the temporary directory - it's BIG!
}


// Dump the other "meta" tables not specific to a crawl.
// TODO: This code assumes that ../downloads/ exists. Instead, it should be able to find the download directory.
function dumpOther() {
	global $gbMobile, $gPagesTableMobile, $gPagesTableDesktop, $gRequestsTableMobile, $gRequestsTableDesktop, $gStatsTableDesktop, $gCrawlsTable, $gUrlsTableDesktop;
	global $gMysqlUsername, $gMysqlPassword, $gMysqlServer, $gMysqlDb;

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
		$cmd = "mysqldump --no-data --skip-add-drop-table -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gStatsTableDesktop $gRequestsTableDesktop $gPagesTableDesktop $gRequestsTableMobile $gPagesTableMobile $gCrawlsTable $gUrlsTableDesktop > $dumpfile";
		exec($cmd);
		lprint("...mysqldump file created: $dumpfile");

		// urls mysql dump
		$dumpfile = "../downloads/httparchive_urls";
		lprint("Creating mysqldump file $dumpfile ...");
		$cmd = "mysqldump --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gUrlsTableDesktop | gzip > $dumpfile.gz";
		exec($cmd);
		lprint("...mysqldump file created: $dumpfile.gz");
	}
}

?>
