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

require_once("utils.inc");
require_once("dbapi.inc");


function addStats($label, $slice, $device, $hStats=null) {
	if ( getStatsData($label, $slice, $device) ) {
		return true;
	}

	if ( ! $hStats ) {
		$hStats = computeStats($label, $slice, $device);
	}

	return addStatsData($label, $slice, $device, $hStats);
}


function replaceStats($label, $slice, $device, $hStats=null) {
	if ( ! $hStats ) {
		$hStats = computeStats($label, $slice, $device);
	}

	removeStatsData($label, $slice, $device);

	return addStatsData($label, $slice, $device, $hStats);
}


function getStats($label, $slice, $device, $url=NULL) {
	if ( $url ) {
		return getStatsDataForUrl($label, $slice, $device, $url);
	}
		
	$hStats = getStatsData($label, $slice, $device);
	if ( ! $hStats ) {
		// We do NOT want to do this because it might get called in the middle of a run.
		//addStats($label, $slice, $device);
		//$hStats = getStatsData($label, $slice, $device);
	}

	return $hStats;
}


function getTrends($slice, $device, $url=NULL) {
	if ( $url ) {
		return getTrendsDataForUrl($url, $device);
	}
	else {
		return getTrendsData($slice, $device);
	}
}


function removeStats($label, $slice=NULL, $device=NULL) {
	if ( !$label && !$slice && !$device ) {
		// error - you have to supply SOMETHING
		return NULL;
	}

	return removeStatsData($label, $slice, $device);
}


function computeStats($label, $slice, $device) {
	return computeStatsData($label, $slice, $device);
}


function computeMissingStats($device, $bVerbose) {
	$aDevices = ( $device ? array($device) : array("IE8", "iphone") );
	$aLabels = archiveLabels();
	$aSlices = sliceNames();
	foreach ( $aDevices as $device ) {
		for ( $i = count($aLabels)-1; $i >= 0; $i-- ) {
			// do labels in reverse chrono order so newest are ready first
			$label = $aLabels[$i];
			foreach ( $aSlices as $slice ) {
				if ( getStatsData($label, $slice, $device) ) {
					if ( $bVerbose ) { echo "$label $slice $device..."; }
					addStats($label, $slice, $device);
					if ( $bVerbose ) { echo "DONE\n"; }
				}
			}
		}
	}
}

?>
