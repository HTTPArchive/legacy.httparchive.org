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

<style>
.chart { 
	border: 1px solid #BBB; 
	padding: 4px; 
	margin-bottom: 40px; }
</style>
	
<?php
$device = ($gbMobile ? "iphone" : "IE8");
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

echo format2LineChart('reqTotal', 'bytesTotal', $hTrends, $aRunNames, $labels);
echo format2LineChart('reqHtml', 'bytesHtml', $hTrends, $aRunNames, $labels);
echo format2LineChart('reqJS', 'bytesJS', $hTrends, $aRunNames, $labels);
echo format2LineChart('reqCSS', 'bytesCSS', $hTrends, $aRunNames, $labels);
echo format2LineChart('reqImg', 'bytesImg', $hTrends, $aRunNames, $labels);
echo format2LineChart('reqFlash', 'bytesFlash', $hTrends, $aRunNames, $labels);

foreach(array('PageSpeed', 'numDomains', 'perGlibs', 'perFlash', 'maxageNull', 'perHttps', 'perErrors', 'perRedirects') as $field) {
	echo formatChart($field, $hTrends, $aRunNames, $labels);
}

function format2LineChart($field, $field2, $hTrends, $aRunNames, $labels) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$color2 = fieldColor($field2);
	$suffix2 = fieldUnits($field2);

	$fieldVals = fieldValues($field, $hTrends, $aRunNames, $min, $max, false);
	$max = intval(intval($max)*1.5);
	$step = ( $max > 1500 ? 500 : ( $max > 200 ? 100 : ( $max > 100 ? 20 : 10 ) ) );
	$fieldVals2 = fieldValues($field2, $hTrends, $aRunNames, $min2, $max2, false);
	$step2 = ( $max2 > 1500 ? 500 : ( $max2 > 200 ? 100 : ( $max2 > 100 ? 20 : 10 ) ) );
	$skip = getSkip(count($aRunNames));
	$url = "http://chart.apis.google.com/chart" .
		"?chd=t:-1|$fieldVals|-1|$fieldVals2" .
		"&chxl=0:|$labels" .
		"&chxt=x,y,r" .
		"&chs=600x300" .
		"&cht=lxy" .
		"&chco=$color,$color2" .
		"&chm=N" . ( $suffix ? "**+$suffix" : "" ) . ",$color,0,$skip,12,,h::8" . "|N" . ( $suffix2 ? "**$suffix2" : "" ) . ",$color2,1,$skip,12,,h::8" .
		"&chds=9,99,$min,$max,9,99,$min2,$max2" .
		"&chts=$color2,24" .
		"&chtt=" . urlencode(fieldTitle($field2)) . "+%26+" . urlencode(fieldTitle($field)) . 
		"&chma=5,5,5,25" .
		"&chls=1,6,3|1" .
		"&chxr=1,$min2,$max2,$step2|2,$min,$max,$step" .
		"&chxs=1,$color2,11.5,-0.5,lt,$color2,$color2|2,$color,11.5,-0.5,lt,$color,$color" .
		"&chxtc=0,4|1,4" .
		"&chxp=0&chdl=" . urlencode(fieldTitle($field)) . "|" . urlencode(fieldTitle($field2)) . "+(kB)&chdlp=bv|r" .
		"";

	return "<div id='$field2&$field' style='margin: 40px 0 60px 0;'><a href='#$field2&$field'><img src=$url width=600 height=300></a></div>\n";
}


function formatChart($field, $hTrends, $aRunNames, $labels) {
	$color = fieldColor($field);
	$suffix = fieldUnits($field);
	$skip = getSkip(count($aRunNames));
	$fieldVals = fieldValues($field, $hTrends, $aRunNames, $min, $max);
	if ( strpos("x|perFlash|PageSpeed|perGlibs|maxageNull|perErrors|perRedirects|perHttps|", "|$field|") ) {
		$max = 100;
	}

	$url = "http://chart.apis.google.com/chart" .
		"?chd=t:-1|$fieldVals" . 
		"&chxl=0:|$labels&chxt=x&chs=600x300&cht=lxy&chco=$color" .
		"&chxs=0,676767,11.5,0,lt,676767&chxtc=0,8&chm=N" . ( $suffix ? "**+$suffix" : "" ) .
		",$color,0,$skip,12,,h::8&chds=0,100,$min,$max&chts=$color,24&chtt=" . urlencode(fieldTitle($field)) . "&chls=2&chma=5,5,5,25";
	return "<div id='$field' style='margin: 40px 0 60px 0;'><a href='#$field'><img src=$url width=600 height=300></a></div>\n";
}


function getSkip($num, $bNum = false) {
	$skip = ( $num < 22 ? 1 : ( $num < 32 ? 2 : 3 ) );

	if ( $bNum ) {
		return $skip;
	}
	else {
		// always show the LAST value
		return ( 0 === ($num % 2) ? "1::$skip" : "::$skip" );
	}
}


function getLabels($aLabels) {
	$skip = abs(getSkip(count($aLabels), true));
	$len = count($aLabels);
	$aNewLabels = array_fill(0, $len, " ");  // have to create all array elements to set in reverse order? php weirdness?
	$iLabel = 0;
	for ( $i = $len-1; $i >= 0; $i-- ) {
		$aNewLabels[$i] = ( 0 === ($iLabel % $skip) ? $aLabels[$i] : " " );
		$iLabel++;
	}

	return urlencode(implode("|", $aNewLabels));
}


function fieldValues($field, $hTrends, $aRunNames, &$min, &$max, $bZero = true) {
	$aValues = array();
	foreach($aRunNames as $run) {
		$aValues[] = ( array_key_exists($run, $hTrends) ? $hTrends[$run][$field] : "_" );
	}
	findScale($aValues, $min, $max, $bZero);

	return implode(",", $aValues);
}


function findScale($aValues, &$min, &$max, $bZero = true) {
	$minValue = min($aValues);
	$maxValue = max($aValues);

	if ( "_" === $minValue || "_" === $maxValue ) {
		$minValue = $maxValue = null;
		for ( $i = 0; $i < count($aValues); $i++ ) {
			$val = $aValues[$i];
			if ( "_" === $val ) {
				continue;
			}
			$minValue = ( isset($minValue) && $minValue < $val ? $minValue : $val );
			$maxValue = ( isset($maxValue) && $maxValue > $val ? $maxValue : $val );
		}
	}

	// Power of 10 less than the min - eg 4719 ==> 3000
	$min = 0;
	if ( ! $bZero && 20 < $minValue ) {
		$base = pow(10, floor(log10($minValue)));
		$min = $base * ( floor($minValue/$base) > 1 ? floor($minValue/$base) - 1 : 1 );
	}

	// Multiple of power of 10 less than max value - eg 4719 ==> 5000
	$max = 10;
	if ( $maxValue > 10 ) {
		$base = pow(10, floor(log10($maxValue)));
		$max = $base * ceil($maxValue/$base);
	}
}
?>


