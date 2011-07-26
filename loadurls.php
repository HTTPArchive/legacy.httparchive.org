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

/* 
DESCRIPTION: Create a table of ranked URLs to crawl from a file.
*/

require_once("utils.php");

$gUrlsTableNew = $gUrlsTable . time();
$gUrlsTablePrev = $gUrlsTable . "Prev";
$gUrlsFile = "./lists/Quantcast-Top-Million.txt";
$cnt = 0;

if ( ! file_exists($gUrlsFile) ) {
   echo "ERROR: URLs file \"$gUrlsFile\" doesn't exist.\n";
   exit();
}


// Create a temporary URLs table.
$urlsTableOrig = $gUrlsTable;
$gUrlsTable = $gUrlsTableNew;
createTables();
$gUrlsTable = $urlsTableOrig;

if ( ! tableExists($gUrlsTableNew) ) {
	echo "ERROR: Temporary table \"$gUrlsTableNew\" wasn't created.\n";
	exit();
}


// File is too big to read with file()
// $lines = file($gUrlsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$handle = @fopen($gUrlsFile, "r");
if ( $handle ) {
    while (($line = fgets($handle, 4096)) !== false) {
		$line = rtrim($line);
		if ( preg_match('/^([0-9]*)\s(.*)$/', $line, $aMatches) ) {
			$rank = $aMatches[1];
			$urlOrig = $aMatches[2];  // for Quantcast this is just a domain, eg, "google.com"
			$url = doSimpleCommand("select url from $gUrlsTable where urlOrig='$urlOrig';");
			if ( ! $url ) {
				// TODO - When we do the crawl we'll have to improve the quality of the URLs - avoid redirects, etc.
				$url = "http://www." . $urlOrig . "/";
			}
			$cmd = "insert into $gUrlsTableNew set rank=$rank, url='$url', urlOrig='$urlOrig';";
			doSimpleCommand($cmd);
		}
		$cnt++;
		if ( $cnt > 100000 ) {
			break;
		}
    }
    fclose($handle);
}
else {
	echo "ERROR: Unable to open file \"$gUrlsFile\".\n";
}

// Remove the temporary table.
doSimpleCommand("drop table $gUrlsTablePrev;");
doSimpleCommand("rename table $gUrlsTable to $gUrlsTablePrev;");
doSimpleCommand("rename table $gUrlsTableNew to $gUrlsTable;");

echo "DONE\n";
?>
