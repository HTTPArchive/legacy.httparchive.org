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

require_once("utils.inc");

$gUrlsFile = "./lists/Quantcast-Top-Million.txt";

if ( ! file_exists($gUrlsFile) ) {
   echo "ERROR: URLs file \"$gUrlsFile\" doesn't exist.\n";
   exit();
}

createTables();  // create the URLs table

// Clear out all the current rankings.
// If a URL is no longer in the list, it'll stay in the table but not be referenced.
// This is good - perhaps that URL might come back in the list and we want to preserve it's derived URL.
doSimpleCommand("update $gUrlsTable set rank=null;");

// File is too big to read with file()
// $lines = file($gUrlsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$handle = @fopen($gUrlsFile, "r");
if ( $handle ) {
    while (($line = fgets($handle, 4096)) !== false) {
		$line = rtrim($line);
		if ( preg_match('/^([0-9]*)\s(.*)$/', $line, $aMatches) ) {
			$rank = $aMatches[1];
			$domain = $aMatches[2];    // Quantcast's list just has a domain, eg, "google.com"
			doSimpleCommand("replace into $gUrlsTable set domain='$domain', rank=$rank;");
		}
    }
    fclose($handle);
}
else {
	echo "ERROR: Unable to open file \"$gUrlsFile\".\n";
}


echo "DONE\n";
?>
