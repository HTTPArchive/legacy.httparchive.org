<?php
require_once("../settings.inc");
require_once("../utils.inc");

// update new/modified stats
require_once("../stats.inc");
require_once("../dbapi.inc");

//computeMissingStatsFixit("IE8", true);
computeMissingStatsFixit2(NULL);



function computeMissingStatsFixit2($device, $bVerbose=false) {
	$pagesTable = pagesTable($label, $slice, $device);
	$requestsTable = requestsTable($label, $slice, $device);

	$aDevices = ( $device ? array($device) : array("IE8", "iphone") );
	$aLabels = archiveLabels();
	$aSlices = sliceNames();
	foreach ( $aDevices as $device ) {
		foreach ( $aSlices as $slice ) {
			for ( $i = count($aLabels)-1; $i >= 0; $i-- ) {
				// do labels in reverse chrono order so newest are ready first
				$label = $aLabels[$i];

				$sliceCond = sliceCond($label, $slice, $device);  // this might be expensive - compute it once
				$query = "select count(*) from $pagesTable where $sliceCond;";
				$totalPages = doSimpleQuery($query);

				$query = "select count(distinct pageid) from $requestsTable where $sliceCond and ( " .
					"(resp_content_type like '%font%') or " .   // content-type contains "font"
					"(urlShort like 'http://use.typekit.%' and resp_content_type = 'text/css') or " . // TypeKit CSS with data: URIs
					"(url like '%.eot' or url like '%.eot?%' or url like '%.ttf' or url like '%.ttf?%' or url like '%.ttc' or url like '%.ttc?%' or url like '%.woff' or url like '%.woff?%' or url like '%.otf' or url like '%.otf?%')" . // file extension
					");";
				$num = doSimpleQuery($query);
				$perFonts = round(100*$num/$totalPages);

				$cmd = "update statsdev set perFonts=$perFonts where label='$label' and slice='$slice' and device='$device';";
				doSimpleCommand($cmd);
				$cmd = "update stats set perFonts=$perFonts where label='$label' and slice='$slice' and device='$device';";
				doSimpleCommand($cmd);
				echo "$perFonts = 100 * $num / $totalPages\ncmd = $cmd\n";
			}
		}
	}
}



function computeMissingStatsFixit($device, $bVerbose=false) {
	$pagesTable = pagesTable($label, $slice, $device);
	$requestsTable = requestsTable($label, $slice, $device);

	$aDevices = ( $device ? array($device) : array("IE8", "iphone") );
	$aLabels = archiveLabels();
	$aSlices = sliceNames();
	foreach ( $aDevices as $device ) {
		foreach ( $aSlices as $slice ) {
			for ( $i = count($aLabels)-1; $i >= 0; $i-- ) {
				// do labels in reverse chrono order so newest are ready first
				$label = $aLabels[$i];

				$sliceCond = sliceCond($label, $slice, $device);  // this might be expensive - compute it once
				$query = "select count(*) from $pagesTable where $sliceCond;";
				$totalPages = doSimpleQuery($query);
				$query = "select count(distinct pageid) from $requestsTable where $sliceCond and url like '%googleapis.com%';";
				$num = doSimpleQuery($query);
				$perGlibs = round(100*$num/$totalPages);
				echo "$label, $slice = $perGlibs\n";
			}
		}
	}
}


?>
