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

createTables();

if ( array_key_exists(1, $argv) ) {
	$gUrlsFile = $argv[1];
}
if ( array_key_exists(2, $argv) ) {
	$gFileType = $argv[2];
}

if ( isset($gUrlsFile) && "alexa" != $gFileType && "other" != $gFileType ) {
	die("ERROR: If you specifiy a urlsfile you must also specify the file type: \"alexa\" or \"other\".\n");
}

if ( ! isset($gUrlsFile) ) {
	// download the list of URLs into a file
	$gUrlsFile = downloadAlexaList();
	$gFileType = "alexa";
}

if ( ! file_exists($gUrlsFile) ) {
	die("ERROR: URLs file \"$gUrlsFile\" doesn't exist.\n");
}

echo "Importing URLS: file = $gUrlsFile, file type = $gFileType\n";

// Clear out all the current rankings.
// If a URL is no longer in the list, it'll stay in the table but not be referenced.
// This is good - perhaps that URL might come back in the list and we want to preserve it's derived URL.
if ( "alexa" === $gFileType ) {
	doSimpleCommand("update $gUrlsTable set ranktmp=null;");
}


$handle = @fopen($gUrlsFile, "r");
if ( $handle ) {
	$sInsert = "";
	$n = 0;

	while (($line = fgets($handle, 4096)) !== false) {
		$line = rtrim($line);
		$urlOrig = $rank = $other = "";
		if ( "alexa" === $gFileType ) {
			if ( preg_match('/^([0-9]*),(.*)$/', $line, $aMatches) ) {
				$urlOrig = "http://www." . $aMatches[2] . "/";
				$rank = $aMatches[1];
			}
		}
		else if ( "other" === $gFileType ) {
			if ( preg_match('/^(http[s]*:\/\/.*\/)$/', $line, $aMatches) ) {
				$urlOrig = $aMatches[1];
				$other = "true";
			}
		}

		if ( $urlOrig ) {
			$sInsert .= ",('" . mysqlEscape($urlOrig) . "'" . 
				( $rank  ? ", $rank"  : "" ) . 
				( $other ? ", $other" : "" ) .
				")";
			$n++;
			if ( 0 === ( $n % 1000 ) ) {
				// faster to do many inserts at a time
				doSimpleCommand("insert into $gUrlsTable (urlOrig" .
								( $rank  ? ", ranktmp"  : "" ) .
								( $other ? ", other" : "" ) . 
								") VALUES " . substr($sInsert, 1) .
								" ON DUPLICATE KEY UPDATE " .
								( $rank  ? "ranktmp=VALUES(ranktmp)"  : "" ) .
								( $other ? ($rank ? ", " : "" ) . "other=VALUES(other)" : "" )
								);
				$sInsert = "";
			}
		}
	}

	// catch any final inserts
	if ( $sInsert ) {
				doSimpleCommand("insert into $gUrlsTable (urlOrig" .
								( $rank  ? ", ranktmp"  : "" ) .
								( $other ? ", other" : "" ) . 
								") VALUES " . substr($sInsert, 1) .
								" ON DUPLICATE KEY UPDATE " .
								( $rank  ? "ranktmp=VALUES(ranktmp)"  : "" ) .
								( $other ? ($rank ? ", " : "" ) . "other=VALUES(other)" : "" )
								);
	}

    fclose($handle);
}
else {
	echo "ERROR: Unable to open file \"$gUrlsFile\".\n";
}

if ( "alexa" === $gFileType ) {
	doSimpleCommand("update $gUrlsTable set rank=ranktmp;");
	echo "The ranks have been updated.\n";
}

// update the urlhash column if null
// WARNING: URLs added through the admin.php page do NOT have urlhash set immediately - but they should be caught here.
// "urlhash" is a substring of the URL's MD5 hash converted to base-10.
doSimpleCommand("update $gUrlsTable set urlhash=conv(substring(md5(urlOrig), 1, 4), 16, 10) where urlhash is null;");
echo "The urlhash have been updated.\n";

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
