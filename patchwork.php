<?php 
require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");

$gTitle = "Render Patchwork";
$gTime = getParam('t', '0'); // milliseconds
$gN = getParam('n', 100); // number of top sites to look at
$gL = getParam('l');
$gTO = getParam('to', 500);
$gW = getParam('w', 200); // normal dimensions are 138x200 or 90x200
// mobile images are 200x300, IE are 200x138
$gH = round( ($gbMobile ? 300 : 138)*$gW/200 );
if ( ! $gL ) {
	$gL = latestLabel(); // only do this if we have to
}
if ( $gN <= 0 || 100 < $gN ) {
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
A, A:hover { border-bottom: 0px solid #FFF; text-decoration: none; }
SELECT { vertical-align: super; }
.square { float: left; }
</style>
<script>
var gTime = <?php echo $gTime ?>;
var gN = <?php echo $gN ?>;
var gStep = <?php echo ( $gbMobile ? 1000 : 100 ) ?>;
var gbPlay = false;
var gbMobile = <?php echo ( $gbMobile ? "true" : "false" ) ?>;

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
		forward();
		setTimeout(loop, <?php echo $gTO ?>); // Can't play back in realtime (or can we?).
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


function doSize(w) {
	if ( ! checkReady() ) {
		return;
	}

	if ( ! w ) {
		var sel = document.getElementById('size');
		w = parseInt(sel.options[sel.selectedIndex].value);
		if ( ! w ) {  // 0?
			return;
		}
	}
	var h = parseInt( (gbMobile ? 300 : 138)*w/200 );

	var allthumbs = document.getElementById('allthumbs');
	var aImages = allthumbs.getElementsByTagName('img');
	var len = aImages.length;
	for ( var i = 0; i < len; i++ ) {
		var image = aImages[i];
		image.style.width = w + "px";
		image.style.height = h + "px";
		var parent = image.parentNode.parentNode;
		parent.style.width = w + "px";
		parent.style.height = h + "px";
	}
}

var hPages = {}; // this gets added to by patchwork.js
</script>
</head>

<body>

<!--
<?php echo uiHeader($gTitle); ?>
-->

<div style="font-size: 2em;">
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:back()" title="Back">-</a>
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:play()" title="Play" id=playbtn><img src="images/playButton.png" style="vertical-align: middle;"></a>
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF; display: none;" href="javascript:pause()" title="Pause" id=pausebtn><img src="images/pauseButton.png" style="vertical-align: middle;" width=41></a>
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:forward()" title="Forward">+</a>
<form style="margin-left: 0.6em; display:inline;" onsubmit="doSubmitTime();return false;">
<input id=time type=text size=5 value=<?php echo $gTime ?> style="text-align: right; border-color: #333; margin: 0 0 0.2em 0; background: #000;"> ms
</form>
<form style="margin-left: 0.6em; display:inline; font-size: 0.6em;">
<select id=size onchange="doSize()">
<option value=50> tiny
<option value=100> small
<option value=200 selected> medium
<option value=400> large
</select>
</form>
<form style="margin-left: 1em; display:inline; font-size: 0.6em;">
	<?php echo selectArchiveLabel($gArchive, $gL); ?>
</form>
</div>

<div id=allthumbs>
<?php
// Display a thumbnail of the Top N websites at a certain time in the loading process.
$query = "select rank, pageid, url, wptid, wptrun from $gPagesTable where label='$gL' and rank > 0 and rank <= " . (2*$gN) . " order by rank asc;";
$result = doQuery($query);
if ( 0 == mysql_num_rows($result) ) {
	mysql_free_result($result);
	$query = "select u.rank, pageid, url, wptid, wptrun from $gPagesTable, $gUrlsTable as u where label='$gL' and u.rank > 0 and u.rank <= " . (2*$gN) . " and urlOrig=url order by u.rank asc;";
	$result = doQuery($query);
}
$i = 0;
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ! onBlackList($url) ) {
		$pageid = $row['pageid'];
		$wptid = $row['wptid'];
		$wptrun = $row['wptrun'];
		$rank = $row['rank'];
		echo "<div style='height: {$gH}px; width: {$gW}px; float: left; background: #FFF;'>" . // show white in case of missing images
			"<a href='viewsite.php?pageid=$pageid' title='$url' style='broder-bottom: 0;'>" .
			"<img id=$pageid data-wptid='$wptid' data-wptrun=$wptrun style='border-width: 0; height: {$gH}px; width: {$gW}px;' src='frame.php?t=$gTime&wptid=$wptid&wptrun=$wptrun'>" .
			"</a>" .
			"</div>" .
			"";
		$i++;
		if ( $i >= $gN ) {
			break;
		}
	}
}
mysql_free_result($result);
?>
</div>

<script src="patchwork.js?n=<?php echo $gN ?>&l=<?php echo $gL ?>" async></script>
</body>
</html>

