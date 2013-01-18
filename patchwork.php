<?php 
require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");

$gTitle = "Render Patchwork";
$gTime = getParam('t', '0'); // milliseconds
$gN = getParam('n', 100); // number of top sites to look at
if ( $gN <= 0 || 1000 < $gN ) {
	$gN = 100;
}
$wptServer = wptServer();
?>
<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title><?php echo genTitle($gTitle) ?></title>

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
<style>
BODY { padding: 0; margin: 0; width: 100%; background: #000; }
.square { float: left; }
#time { margin: 0 1em; }
</style>
<script>
var gTime = <?php echo $gTime ?>;
var gN = <?php echo $gN ?>;
var gStep = <?php echo ( $gbMobile ? 1000 : 100 ) ?>;
var gbPlay = false;

function forward() {
	if ( checkReady() ) {
		if ( ! checkDone() ) {
			adjustTime(gStep);
			adjustImages();
			checkDone();
		}
	}
}


function back() {
	if ( checkReady() ) {
		adjustTime(-gStep);
		adjustImages();
	}
}


function play() {
	if ( checkReady() ) {
		gbPlay = true;
		toggle(false);
		loop();
	}
}


function loop() {
	if ( gbPlay ) {
		if ( document.getElementById('time').value > 15000 ) {
			return;
		}
		forward();
		setTimeout(loop, 200); // it takes about 1 second
	}
}


function pause() {
	gbPlay = false;
	toggle(true);
}


function adjustImages() {
	var allthumbs = document.getElementById('allthumbs');
	var aImages = allthumbs.getElementsByTagName('img');
	var len = aImages.length;
	for ( var i = 0; i < len; i++ ) {
		var image = aImages[i];
		adjustImage(image);
	}
}


function adjustImage(image) {
	var pageid = image.id;
	var hFrames = hPages[pageid];
	if ( hFrames[gTime] ) {
		// this site has a screen update for the current time
		var f = "0000" + parseInt(gTime/100);
		f = f.substring(f.length-4); // eg, "0025" is 2500 ms
		image.src = "<?php echo $wptServer ?>thumbnail.php?test=" + image.getAttribute("data-wptid") + 
			"&width=200&file=video_" + image.getAttribute("data-wptrun") + "/frame_" + f + ".jpg";
	}
}


function adjustTime(delta) {
	gTime += delta;
	document.getElementById('time').value = gTime;
}


// We request the image frames info asynchronously, so must confirm it's available.
function ready() {
	return ( "undefined" != typeof(msMax) );
}


function checkReady() {
	if ( ! ready() ) {
		alert("Sorry - we're still downloading the rendering information. Try again in a second or two.");
		return false;
	}

	return true;
}


function checkDone() {
	if ( gTime > msMax ) {
		gbPlay = false; // turn off play (if it's on)
		toggle(true);   // restore play button (if it's not there)
		alert("Done");
		return true;
	}

	return false;
}


function toggle(bShowPlay) {
	document.getElementById('playbtn').style.display = (bShowPlay ? "inline" : "none");
	document.getElementById('pausebtn').style.display = (bShowPlay ? "none" : "inline");
}


function doSubmitTime() {
	var time = document.getElementById('time').value;
	document.location = "patchwork.php?t=" + time + "&n=" + gN;
}

var hPages = {}; // this gets added to by patchwork.js
</script>
</head>

<body>

<!--
<?php echo uiHeader($gTitle); ?>
-->

<div style="font-size: 2em;">
<a style="margin-left: 0.6em; border-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:back()" title="Back">-</a>
<a style="margin-left: 0.6em; border-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:play()" title="Play" id=playbtn><img src="images/playButton.png" style="vertical-align: middle;"></a>
<a style="margin-left: 0.6em; border-bottom: 0; font-size: 1.5em; color: #FFF; display: none;" href="javascript:pause()" title="Pause" id=pausebtn><img src="images/pauseButton.png" style="vertical-align: middle;" width=41></a>
<a style="margin-left: 0.6em; border-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:forward()" title="Forward">+</a>
<form style="margin-left: 0.6em; display:inline;" onsubmit="doSubmitTime();return false;">
<input id=time type=text size=5 value=<?php echo $gTime ?> style="text-align: right; border-color: #333; margin: 0 0 0.2em 0; background: #000;"> ms
</form>
<!--
<span id=msg style="font-size: 0.7em; margin-left: 1em; color: #C30; font-style: italic;">click "+" to see the screens render</span>
-->
</div>

<div id=allthumbs>
<?php
// Display a thumbnail of the Top N websites at a certain time in the loading process.
$crawl = latestLabel();
$query = "select rank, pageid, url, wptid, wptrun from $gPagesTable where label='$crawl' and rank > 0 and rank <= " . (2*$gN) . " order by rank asc;";
$result = doQuery($query);
$i = 0;
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ! onBlackList($url) ) {
		$pageid = $row['pageid'];
		$wptid = $row['wptid'];
		$wptrun = $row['wptrun'];
		$rank = $row['rank'];
		echo "<div class=square><a href='viewsite.php?pageid=$pageid' title='$url' style='border-bottom: 0;'>" .
			"<img id=$pageid data-wptid='$wptid' data-wptrun=$wptrun border=0 height=140 src='frame.php?t=$gTime&wptid=$wptid&wptrun=$wptrun'>" .
			"</a></div>\n";
		$i++;
		if ( $i >= $gN ) {
			break;
		}
	}
}
mysql_free_result($result);
?>
</div>

<script src="patchwork.js?n=<?php echo $gN ?>&crawl=<?php echo $crawl ?>" async></script>
</body>
</html>

