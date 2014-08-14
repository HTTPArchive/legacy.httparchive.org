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
Include file for generating trending charts. 
*/
require_once("utils.inc");
require_once("stats.inc");
require_once("charts.inc");
?>

<?php
$device = curDevice();
$hTrends = getTrends($gSlice, $device, $gUrl);

// Create a chart for each field.
$aRunNames = archiveLabels($gArchive, false);
$aAxisLabels = archiveLabels($gArchive, true, "n/j");
$labels = getLabels($aAxisLabels); 

if ( "url" != $gSlice ) {
	// show URLs first so people can see if they're doing intersection or not
	// but don't show it if we're only looking at a single URL
	echo formatChart('numurls', $hTrends, $aRunNames, $labels);
}

// Time is too inconsistent. Only show it if the backdoor querystring param is present:
if ( array_key_exists("plt", $_GET) ) {
	echo format2LineChart('renderStart', 'onLoad', $hTrends, $aRunNames, $labels, "(ms)", true, "<div style='margin-left: 2em; font-size:0.9em;'>* Based on limited, synthetic data. See <a href='http://dev.httparchive.org/about.php#accuracy'>FAQ</a> for known biases.</div>", "(ms)");
}

echo format2LineChart('reqTotal', 'bytesTotal', $hTrends, $aRunNames, $labels, "(kB)", false);
echo format2LineChart('reqHtml', 'bytesHtml', $hTrends, $aRunNames, $labels, "(kB)", false);
echo format2LineChart('reqJS', 'bytesJS', $hTrends, $aRunNames, $labels, "(kB)", false);
echo format2LineChart('reqCSS', 'bytesCSS', $hTrends, $aRunNames, $labels, "(kB)", false);
echo format2LineChart('reqImg', 'bytesImg', $hTrends, $aRunNames, $labels, "(kB)", false);
if ( ! $gbMobile ) {
	echo format2LineChart('reqFlash', 'bytesFlash', $hTrends, $aRunNames, $labels, "(kB)", false);
}
echo format2LineChart('reqFont', 'bytesFont', $hTrends, $aRunNames, $labels, "(kB)", false);
echo format2LineChart('reqOther', 'bytesOther', $hTrends, $aRunNames, $labels, "(kB)", false);

if ( ! $gbMobile ) {
	echo formatChart('_connections', $hTrends, $aRunNames, $labels);
}

if ( $gbMobile ) {
	// we don't have PageSpeed on mobile :-(
	// Speed Index is too erratic - hide it similar to Page Load
	//echo formatChart('SpeedIndex', $hTrends, $aRunNames, $labels);
	// we don't have numDomElements on mobile :-(
	echo formatChart('bytesHtmlDoc', $hTrends, $aRunNames, $labels, "(kB)");
}
else {
	// Speed Index is too erratic - hide it similar to Page Load
	// echo format2LineChart('PageSpeed', 'SpeedIndex', $hTrends, $aRunNames, $labels);
	echo formatChart('PageSpeed', $hTrends, $aRunNames, $labels);
	echo format2LineChart('numDomElements', 'bytesHtmlDoc', $hTrends, $aRunNames, $labels, "(kB)");
}
echo format2LineChart('maxDomainReqs', 'numDomains', $hTrends, $aRunNames, $labels);

echo formatChart("maxage0", $hTrends, $aRunNames, $labels);

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


