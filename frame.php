<?php 

require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");
require_once("urls.inc");
require_once("pages.inc");

// Return a redirect to the filmstrip frame closest to but BEFORE the time specified.
$gTime = getParam('t', '2500'); // milliseconds
$wptid = getParam('wptid');
$wptrun = getParam('wptrun');
$gPageid = getParam('pageid');

$wptServer = wptServer();
$xmlurl = "{$wptServer}xmlResult.php?test=$wptid";
$xmlstr = fetchUrl($xmlurl);
$xml = new SimpleXMLElement($xmlstr);
$frames = $xml->data->run[($wptrun - 1)]->firstView->videoFrames;
$tbefore = 0;
$tafter = 0;
if ( $frames->frame ) {
	foreach($frames->frame as $frame) {
		// Find the time of a frame that is BEFORE the requested time.
		$ms = floatval($frame->time) * 1000;
		if ( $ms > $gTime ) {
			$tafter = $ms;
			break;
		}
		$tbefore = $ms;
	}
}
$f = "0000" . ($tbefore/100);
$f = substr($f, strlen($f)-4);
if ( $gbMobile && "0000" == $f && $gPageid < 12217 ) {
	// There's a bug in Blaze's WPT that calls the "0.0s" image "frame_0010.jpg" instead of "frame_0000.jpg" up until Oct 1, 2011.
	$f = "0010";
}
$imgUrl = "{$wptServer}thumbnail.php?test=$wptid&width=200&file=video_$wptrun/frame_$f.jpg";
header("Location: $imgUrl");
?>
