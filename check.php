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

require_once("utils.php");

$gArchive = $argv[1];
$gLabel = $argv[2];

if ( ! $gArchive ) {
	echo "ERROR: You must provide an archive name.\n";
	exit();
}


echo "Checking archive \"$gArchive\" and label \"$gLabel\"...\n";

$harDir = getHarDir($gArchive, $gLabel);
$resultstxt = $harDir . "results.txt";
$urlstxt = $harDir . "urls.txt";

// Which HAR files are missing.
$sUrls = file_get_contents($urlstxt);
$aUrls = explode("\n", $sUrls);
$sErrorUrls = "";
for ( $i = 0; $i < count($aUrls); $i++ ) {
	$sErrors = "";
	$bExists = false;
	$url = $aUrls[$i];
	if ( $url ) {             // avoid blank lines
		$pathname = getHarPathname($gArchive, $gLabel, $url);
		if ( $pathname && file_exists($pathname) ) {
			$bExists = true;
		}

		if ( ! $bExists ) {
			$sErrors .= "ERROR: HAR file missing: $url ($pathname)\nACTION: Resubmit to WebPagetest.org\n";
		}
		else {
			$query = "select pageid from $gPagesTable where archive = '$gArchive' and label = '$gLabel' and url = '$url';";
			$pageid = doSimpleQuery($query);
			if ( ! $pageid ) {
				$old = error_reporting(0);
				$bResult = file_get_contents($url);
				error_reporting($old);
				if ( ! $bResult ) {
					$sErrors .= "ERROR: failed to open URL: $url\nACTION: Check the URL. Remove from list.\n";
				}
				else {
					$sErrors .= "ERROR: no pageid found: $url\n";
					$output = array();
					$return_var = 128;
					exec("grep '$url' '$resultstxt'", $output, $return_var);
					$sErrors .= "Line(s) containing '$url' in $resultstxt:\n    " . implode("    ", $output) . "\n" .
						"ACTION: needs further investigation\n";
				}
			}
			else {
				$query = "select wptid from $gPagesTable where pageid = $pageid;";
				$wptid = doSimpleQuery($query);
				if ( ! $wptid ) {
					$output = array();
					$return_var = 128;
					exec("grep '$url' '$resultstxt'", $output, $return_var);
					$sErrors .= "No wptdid - results.txt must have failed.\n;";
					$sErrors .= "Line(s) containing '$url' in $resultstxt:\n    " . implode("    ", $output) . "\n" .
						"ACTION: needs further investigation\n";
				}
			}
		}
		if ( $sErrors ) {
			echo "=== $url\n" . $sErrors . "\n";
			$sErrorUrls .= "$url\n";
		}
	}
}

echo "\nURLs with errors:\n$sErrorUrls\n";

echo "DONE!\n\n";
exit();

?>
