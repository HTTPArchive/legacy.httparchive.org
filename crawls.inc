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
?>
