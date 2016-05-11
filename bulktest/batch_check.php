<?php
/*
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

require_once("../utils.inc");
require_once("batch_lib.inc");
require_once("bootstrap.inc");

$date = getdate();
$label = substr($date['month'], 0, 3) . " " . $date['mday'] . " " . $date['year'];
$aCrawlnames = array("dev", "mobile", "android", "chrome", "ie", "iphone");
foreach( $aCrawlnames as $crawlname ) {
	$sProblems = "";

	// we fill the status table before creating the crawl
	$numStatus = doSimpleQuery("select count(*) from status$crawlname where label = '$label';");
	if ( 0 === $numStatus ) {
		$sProblems .= "    No URLs have been queued up in the status$crawlname table.\n";
	}
	// TODO - It's unfortunate that the 500K and 5K URL counts are hardwired. 
	// Check slight less than the full # of URLs since some URLs have opted out.
	else if ( ( ("dev" === $crawlname || "chrome" === $crawlname || "ie" === $crawlname) && 490000 > $numStatus ) ||
			  ( ("mobile" === $crawlname || "android" === $crawlname || "iphone" === $crawlname) && 4900 > $numStatus ) ) {
		$sProblems .= "    Only $numStatus URLs have been queued up in the status$crawlname table for crawl \"$label\".\n";
	}

	// check that the crawl exists and has the right number of URLs
	$device = curDevice($crawlname);
	$crawl = getCrawl($label, null, $device);
	if ( ! $crawl ) {
		$sProblems .= "    Could not find the crawl for \"$label\".\n";
	}
	else {
		$numUrls = $crawl['numUrls'];
		if ( ( ("dev" === $crawlname || "chrome" === $crawlname || "ie" === $crawlname) && $numStatus !== $numUrls ) ||
			 ( ("mobile" === $crawlname || "android" === $crawlname || "iphone" === $crawlname) && $numStatus !== $numUrls ) ) {
			$sProblems .= "    Only $numUrls URLs (instead of $numStatus) have been set for the $crawlname crawl \"$label\".\n";
		}
	}

	if ( $sProblems ) {
		echo "Problems with the $crawlname crawl:\n$sProblems\n";
	}
}
?>
