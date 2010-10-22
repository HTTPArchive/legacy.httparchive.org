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

$gPageid = ( array_key_exists('pageid', $_GET) ? $_GET['pageid'] : "" );

$query = "select harfile, url, wptid, wptrun, onLoad, renderStart from $gPagesTable where pageid=$gPageid;";
$result = doQuery($query);
$row = mysql_fetch_assoc($result);
$harfile = $row['harfile'];
$url = $row['url'];
$wptid = $row['wptid'];
$wptrun = $row['wptrun'];
$onLoad = $row['onLoad'];
$renderStart = $row['renderStart'];

$xmlurl = "http://www.webpagetest.org/xmlResult.php?test=$wptid";
$xmlstr = file_get_contents($xmlurl);
$xml = new SimpleXMLElement($xmlstr);
$frames = $xml->data->run[($wptrun - 1)]->firstView->videoFrames;

$aTimes = array();
foreach($frames->frame as $frame) {
	$time = floatval($frame->time) * 1000;
	$aTimes[$time] = true;
}

$sTh = "";
$sTd = "";
$aMatches = array();
$url = "";
$pattern = '/([0-9][0-9])([0-9][0-9])([0-9][0-9])_(.*)/';
if ( preg_match($pattern, $wptid, $aMatches) ) {
	$url = "http://www.webpagetest.org/results/" . $aMatches[1] . "/" . $aMatches[2] . "/" . $aMatches[3] . "/" . $aMatches[4] . "/video_$wptrun/frame_";
}
$lastFrameTime = 0;
for ( $i = 0; $i < $onLoad; $i += 100 ) {
	$sTh .= "<th id=th$i>" . ($i/1000) . "s</th> ";
	if ( array_key_exists($i, $aTimes) ) {
		$lastFrameTime = $i;
	}
	$f = "0000" . ($lastFrameTime/100);
	$f = substr($f, strlen($f)-4);
	$sTd .= "<td id=td$i><a target='_blank' href='$url$f.jpg'><img class=thumb width=200 height=140 src='http://www.webpagetest.org/thumbnail.php?test=$wptid&width=200&file=video_$wptrun/frame_$f.jpg'></a></td>";
}
?>

var sTh = "<?php echo $sTh ?>";
var sTd = "<?php echo $sTd ?>";
document.getElementById('videoDiv').innerHTML = "<table id='video'><tr>" + sTh + "</tr><tr>" + sTd + "</tr></table>";

var renderStart = <?php echo $renderStart ?>;
var scrollPos = (parseInt(renderStart/100))*200;
document.getElementById("videoDiv").scrollLeft = scrollPos;
