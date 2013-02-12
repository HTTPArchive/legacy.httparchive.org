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

$gPageid = getParam('pageid');
$wptServer = wptServer();
$query = "select url, wptid, wptrun, onLoad, renderStart from $gPagesTable where pageid='$gPageid';";

$result = doQuery($query);
$row = mysql_fetch_assoc($result);
$url = $row['url'];
$wptid = $row['wptid'];
$wptrun = $row['wptrun'];
$onLoad = $row['onLoad'];
$interval = ( $gbMobile ? 1000 : ( $onLoad > 15000 ? 5000 : ( $onLoad > 4000 ? 1000 : ( $onLoad > 1000 ? 500 : 100 ) ) ) );
$renderStart = $row['renderStart'];

$xmlurl = "{$wptServer}xmlResult.php?test=$wptid";
$xmlstr = fetchUrl($xmlurl);
$xml = new SimpleXMLElement($xmlstr);
$frames = $xml->data->run[($wptrun - 1)]->firstView->videoFrames;
$maxFrame = 0;
$aTimes = array();
if ( $frames->frame ) {
	foreach($frames->frame as $frame) {
		$time = floatval($frame->time) * 1000;
		$aTimes[$time] = true;
		$maxFrame = $time;
	}
}

$sTh = "";
$sTd = "";
$aMatches = array();
$url = "";
$pattern = '/([0-9][0-9])([0-9][0-9])([0-9][0-9])_(.*)/';
if ( preg_match($pattern, $wptid, $aMatches) ) {
	$url = "{$wptServer}results/" . $aMatches[1] . "/" . $aMatches[2] . "/" . $aMatches[3] . "/" . str_replace('_', '/', $aMatches[4]) . "/video_$wptrun/frame_";
}
$lastFrameTime = 0;
for ( $i = 0; $i <= $maxFrame; $i += 100 ) {
	$sTh .= "<th id=th$i style='display: none;'>" . ($i/1000) . "s</th> ";

	$class = "thumb";
	if ( array_key_exists($i, $aTimes) ) {
		$lastFrameTime = $i;
		$class = "thumb changed";
	}

	$f = "0000" . ($lastFrameTime/100);
	$f = substr($f, strlen($f)-4);
	if ( $gbMobile && "0000" == $f && $gPageid < 12217 ) {
		// There's a bug in Blaze's WPT that calls the "0.0s" image "frame_0010.jpg" instead of "frame_0000.jpg" up until Oct 1, 2011.
		$f = "0010";
	}
	$sTd .= "<td id=td$i class='$class' style='display: none;'><a target='_blank' href='$url$f.jpg'><img width=" .
		( $gbMobile ? "93" : "200" ) . 
		" height=140 id='{$wptServer}thumbnail.php?test=$wptid&width=200&file=video_$wptrun/frame_$f.jpg'></a></td>";
}
?>

var sTh = "<?php echo $sTh ?>";
var sTd = "<?php echo $sTd ?>";
document.getElementById('videoDiv').innerHTML = "<table id='video'><tr>" + sTh + "</tr><tr>" + sTd + "</tr></table>";
showInterval(<?php echo $interval ?>);
