<?php
/*
?location - Dulles, UK, 
?most404s
?servers - server1|per1,server2|per2,
?topscripts - script1,per1|script2,per2 - a full URL and percent of sites that use it
*/

$gRev = '$Rev$';

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
