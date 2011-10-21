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

require_once("../utils.inc");

$gUrlsFile = $argv[1];
if ( !$gUrlsFile ) {
	// download the list of URLs into a file
	$gUrlsFile = downloadAlexaList();
}

if ( ! file_exists($gUrlsFile) ) {
	echo "ERROR: URLs file \"$gUrlsFile\" doesn't exist.\n";
	exit();
}


// Clear out all the current rankings.
// If a URL is no longer in the list, it'll stay in the table but not be referenced.
// This is good - perhaps that URL might come back in the list and we want to preserve it's derived URL.
doSimpleCommand("update $gUrlsTable set rank=null;");


$handle = @fopen($gUrlsFile, "r");
if ( $handle ) {
	$sInsert = "";
	$n = 0;
	echo "Insert count: $n ";
    while (($line = fgets($handle, 4096)) !== false) {
		$line = rtrim($line);
		if ( preg_match('/^([0-9]*),(.*)$/', $line, $aMatches) ) {
			$rank = $aMatches[1];
			$domain = $aMatches[2];    // Alexa's list just has a domain, eg, "google.com"
			$sInsert .= ",('$domain', $rank)";
			$n++;
			if ( 0 === ( $n % 1000 ) ) {
				// faster to do many inserts at a time
				doSimpleCommand("replace into $gUrlsTable (domain, rank) VALUES " . substr($sInsert, 1));
				$sInsert = "";
				echo "$n ";
			}
			if ( $rank >= 1000500 ) {
				break;
			}
		}
    }
	if ( $sInsert ) {
		doSimpleCommand("replace into $gUrlsTable (domain, rank) VALUES " . substr($sInsert, 1));
	}
	echo "$n\n";
    fclose($handle);
}
else {
	echo "ERROR: Unable to open file \"$gUrlsFile\".\n";
}

echo "DONE\n";




// return the name of the downloaded file
function downloadAlexaList() {
	$listfile = "top-1m.csv";

	// move current list out of the way
	if ( file_exists($listfile) ) {
		exec("mv $listfile $listfile.prev");
	}

	// get the new file
	if (! file_put_contents("$listfile.zip", file_get_contents("http://s3.amazonaws.com/alexa-static/$listfile.zip")) ) {
		echo "ERROR: Unable to download list file.\n";
		return false;
	}

	// TODO: Do a check to confirm this file is updating everyday.

	exec("gunzip -S .zip $listfile.zip");

	return ( file_exists($listfile) ? $listfile : false );
}

?>
