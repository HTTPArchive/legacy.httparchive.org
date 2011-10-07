<?php
/*
label - Oct 1 2011
device - iphone43, isim, ie8
set - Top 100, intersection, All
?location - Dulles, UK, 
version - version of the stats code so we know what to flush

trends (average)
  numurls
  PageSpeed
  numDomains
  bytesTotal
  bytesHtml
  bytesJS
  bytesCSS
  bytesImg
  bytesFlash
  bytesOther
  reqTotal
  reqHtml
  reqJS
  reqCSS
  reqImg
  reqFlash
  reqOther
% of image responses of a specific image format
  pieGif
  pieJpg
  piePng

simple yes/no percents:
  redirects - 64 [% of websites that have at least one redirect]
  errors - 27 [% of websites that have at least one error]
  flash - [% of websites that have at least one Flash resource]
  google libraries API

https - 27 [% of requests that are https]

maxage:
  binNull
  binLEZero
  bin0to1
  bin1to30
  bin30to365
  binGt365

topjslibs - lib1,per1|lib2,per2 - eg, +1 button

onloadCorrelation - field1|cc1,field2|cc2 in desc order by cc
renderCorrelation - field1|cc1,field2|cc2 in desc order by cc

====================

?most404s
?servers - server1|per1,server2|per2,
?topscripts - script1,per1|script2,per2 - a full URL and percent of sites that use it
*/


$gRev = '$Rev: 536 $';

$ghVersions = array(
					534 => array('CVSNO1', 'CVSNO2'),
					535 => array('CVSNO3', 'CVSNO2')
					);
					
					

// Find which columns to recompute based on the version # when last computed.
function flushFields($thisVer) {
	global $ghVersions;

	$aKeys = array_keys($ghVersions);
	sort($aKeys, SORT_NUMERIC);
	$aKeys = array_reverse($aKeys);
	$delFields = array();
	foreach ( $aKeys as $key ) {
		if ( $thisVer >= $key ) {
			// quick bail - sort versions in descending order and bail once we reach thisVer
			break;
		}

		$delFields = array_merge($delFields, $ghVersions[$key]);
	}

	$delFields = array_unique($delFields);
	sort($delFields);

	return $delFields;
}


function getCurVersion() {
	global $gRev;

	if ( ereg('Rev: ([0-9]*) ', $gRev, $regs) ) {
		return $regs[1];
	}

	return "error";
}

echo implode(", ", flushFields(501)) . "\n\n";
?>
