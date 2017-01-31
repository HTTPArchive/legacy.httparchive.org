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

/*
Include file for generating trending charts. 
*/
require_once("utils.inc");
require_once("stats.inc");
require_once("charts.inc");
?>

<?php
$device = curDevice();
$gPercentile = getParam("per", ""); // hidden feature: add "&per95" to the URL to see 95th percentile value for SOME trending charts (not: urls, percent charts like percent with GLibs)
$hTrends = getTrends($gSlice, $device, $gUrl);

// Create a chart for each field.
$aRunNames = archiveLabels($gArchive, false);
$aAxisLabels = archiveLabels($gArchive, true, "n/y");
$labels = getLabels($aAxisLabels); 


if ( "url" != $gSlice ) {
	// show URLs first so people can see if they're doing intersection or not
	// but don't show it if we're only looking at a single URL
	echo formatChart('numurls', $hTrends, $aRunNames, $labels);
}

// Time is too inconsistent. Only show it if the backdoor querystring param is present:
if ( array_key_exists("plt", $_GET) ) {
	echo format2LineChart("renderStart", "onLoad", $hTrends, $aRunNames, $labels, "(ms)", $gPercentile, true, "<div style='margin-left: 2em; font-size:0.9em;'>* Based on limited, synthetic data. See <a href='http://dev.httparchive.org/about.php#accuracy'>FAQ</a> for known biases.</div>", "(ms)");
}

echo format2LineChart("reqTotal", "bytesTotal", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
echo format2LineChart("reqHtml", "bytesHtml", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
echo format2LineChart("reqJS", "bytesJS", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
echo format2LineChart('num_scripts_async', 'num_scripts_sync', $hTrends, $aRunNames, $labels, "", "", true);
echo format2LineChart("reqCSS", "bytesCSS", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
echo format2LineChart("reqImg", "bytesImg", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
if ( ! $gbMobile ) {
	echo format2LineChart("reqFlash", "bytesFlash", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
}
echo format2LineChart("reqFont", "bytesFont", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
echo format2LineChart("reqOther", "bytesOther", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);

if ( ! $gbMobile ) {
	echo formatChart("_connections", $hTrends, $aRunNames, $labels, $gPercentile);
}

if ( $gbMobile || $gbAndroid || $gbIphone || $gbChrome ) {
	// we don't have numDomElements on these devices :-(
	echo formatChart("bytesHtmlDoc", $hTrends, $aRunNames, $labels, $gPercentile);
}
else {
	echo format2LineChart("numDomElements", "bytesHtmlDoc", $hTrends, $aRunNames, $labels, "(kB)", $gPercentile);
}
echo format2LineChart("maxDomainReqs", "numDomains", $hTrends, $aRunNames, $labels);

echo formatChart("maxage0", $hTrends, $aRunNames, $labels, $gPercentile);

if ( "url" != $gSlice ) {
	// TODO - This hardcoded list of DB fields must be synced with the list in getTrendsData().
	$aCharts = ( $gbMobile ?
				 array('perGlibs', 'perFonts', 'perCompressed', 'perHttps', 'perErrors', 'perRedirects') : 
				 array('perGlibs', 'perFlash', 'perFonts', 'perCompressed', 'perHttps', 'perErrors', 'perRedirects', 'perCdn') );
	foreach($aCharts as $field) {
		echo formatChart($field, $hTrends, $aRunNames, $labels);
	}
}

?>


