<?php 
require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");

$gTitle = "Render Patchwork";
$gCurTime = getParam('t', '0'); // the current time frame (0.1, 0.2, 0.3, etc.) in milliseconds
$gNumUrls = getParam('n', 100); // number of top sites to look at
if ( $gNumUrls <= 0 || 200 < $gNumUrls ) {
	// constrain the # of images
	$gNumUrls = 100;
}
$gLabel = getParam('l');        // crawl label
if ( ! $gLabel ) {
	$gLabel = latestLabel(); // only do this if we have to
}
$gMinStep = ( $gbMobile ? 1000 : 100 ); // finest granularity of screenshots for this browser
$gStep = getParam('step', ( $gbMobile ? 1000 : 1000 ));  // time interval to step during playback
$gW = getParam('w', 100); // normal dimensions are 138x200 or 90x200
// mobile images are 200x300, IE are 200x138
$gH = round( ($gbMobile ? 300 : 138)*$gW/200 );
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
A.img, A.img:hover { border-bottom: 0px solid #FFF; text-decoration: none; }
A.txt { color: #AAF; text-decoration: underline; }
A.txt:hover { color: #DAF; text-decoration: underline; border-bottom: 0; }
SELECT { vertical-align: super; }
.square { float: left; }
</style>
<script>
var gCurTime = <?php echo $gCurTime ?>;
var gNumUrls = <?php echo $gNumUrls ?>;
var gStep = <?php echo $gStep ?>;
var gMinStep = <?php echo $gMinStep ?>;
var gbPlay = false;
var gbMobile = <?php echo ( $gbMobile ? "true" : "false" ) ?>;

function forward() {
	if ( checkReady() ) {
		if ( ! checkDone() ) {
			gotoTime(gCurTime + gStep);
			checkDone();
		}
	}
}


function back() {
	if ( checkReady() ) {
		if ( (gCurTime - gStep) > 0 ) {
			gotoTime(gCurTime - gStep);
		}
	}
}


function gotoTime(t) {
	setTime(t);
	adjustImages();
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
		setTimeout(loop, <?php echo $gStep ?>); // Can't play back in realtime (or can we?).
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
	if ( ! hFrames ) {
		dprint("ERROR: Pageid " + pageid + " wasn't found in hFrames.");
	}
	else { 
		// Iterate backwards through the screenshots to find the right one to show.
		// Slightly more complicated in order to handle when the "step" interval is greater than the filmstrip interval.
		for ( var t = gCurTime; t >= 0; t -= gMinStep ) {
			if ( hFrames[t] ) {
				var f = "0000" + parseInt(t/100);
				f = f.substring(f.length-4); // eg, "0025" is 2500 ms
				image.src = "<?php echo $wptServer ?>thumbnail.php?test=" + image.getAttribute("data-wptid") + 
					"&width=200&file=video_" + image.getAttribute("data-wptrun") + "/frame_" + f + ".jpg";
				return;
			}
		}
	}
}


function setTime(t) {
	gCurTime = t;
	document.getElementById('time').value = gCurTime;
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


// Return true if the current "time" is greater than the latest screenshot.
function checkDone() {
	if ( gCurTime > msMax ) {  // mxMax is defined in patchwork.js
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
	gotoTime(time);
}


function getSize() {
	var sel = document.getElementById('size');
	return parseInt(sel.options[sel.selectedIndex].value);
}


function getLabel() {
	var sel = document.getElementById('sellabel');
	return sel.options[sel.selectedIndex].value;
}


function doSize(w) {
	if ( ! checkReady() ) {
		return;
	}

	if ( ! w ) {
		w = getSize();
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


function gotoLink() {
	document.location = "patchwork.php?t=" + document.getElementById('time').value + "&w=" + getSize() + "&l=" + getLabel() + "&n=" + gNumUrls;
}


function dprint(msg) {
	if ( console && console.log ) {
		console.log(msg);
	}
}


var hPages = {}; // this gets added to by patchwork.js
</script>
</head>

<body>
<div style="font-size: 2em;">
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:back()" title="Back">-</a>
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:play()" title="Play" id=playbtn><img src="images/playButton.png" style="vertical-align: middle;"></a>
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF; display: none;" href="javascript:pause()" title="Pause" id=pausebtn><img src="images/pauseButton.png" style="vertical-align: middle;" width=41></a>
<a style="margin-left: 0.6em; broder-bottom: 0; font-size: 1.5em; color: #FFF;" href="javascript:forward()" title="Forward">+</a>
<form style="margin-left: 0.6em; display:inline;" onsubmit="doSubmitTime();return false;">
<input id=time type=text size=5 value=<?php echo $gCurTime ?> style="text-align: right; border-color: #333; margin: 0 0 0.2em 0; background: #000; color: #DDD;"> ms
</form>
<form style="margin-left: 0.6em; display:inline; font-size: 0.6em;">
<select id=size onchange="doSize()">
<option value=50 <?php echo ( 50 == $gW ? "selected" : "" ) ?>> tiny
<option value=100 <?php echo ( 100 == $gW ? "selected" : "" ) ?>> small
<option value=200 <?php echo ( 200 == $gW ? "selected" : "" ) ?>> medium
<option value=400 <?php echo ( 400 == $gW ? "selected" : "" ) ?>> large
</select>
<span style="margin-left: 0.6em;">
	<?php echo selectArchiveLabel($gArchive, $gLabel, true, false); ?>
</span>
</form>
<a href="javascript:gotoLink()" style="margin-left: 1em; font-size: 0.8em;" class=txt>link</a>
</div>

<div id=allthumbs>
<?php
// Display a thumbnail of the Top N websites at a certain time in the loading process.
$limitgoogle = "(url = 'http://www.google.com/' OR url not like '%://www.google.%')"; // There are 10+ sites that all look the same from Google intl sites
$query = "select pageid, url, wptid, wptrun from $gPagesTable where label='$gLabel' and rank > 0 and rank <= " . (2*$gNumUrls) . " and $limitgoogle order by rank asc;";
$result = doQuery($query);
if ( 0 == mysql_num_rows($result) ) {
	mysql_free_result($result);
	// Older crawls do NOT have values for "rank". Use today's rank.
	$query = "select pageid, url, wptid, wptrun from $gPagesTable, $gUrlsTable as u where label='$gLabel' and u.rank > 0 and u.rank <= " . (2*$gNumUrls) . " and urlOrig=url and $limitgoogle order by u.rank asc;";
	$result = doQuery($query);
}
$i = 0;
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ! isAdultContent($url) ) {
		$pageid = $row['pageid'];
		$wptid = $row['wptid'];
		$wptrun = $row['wptrun'];
		echo "<div style='height: {$gH}px; width: {$gW}px; float: left; background: #FFF;'>" . // show white in case of missing images
			"<a href='viewsite.php?pageid=$pageid' title='$url' class=img>" .
			"<img id=$pageid data-wptid='$wptid' data-wptrun=$wptrun style='border-width: 0; height: {$gH}px; width: {$gW}px;' src='frame.php?t=$gCurTime&wptid=$wptid&wptrun=$wptrun&pageid=$pageid'>" .
			"</a>" .
			"</div>" .
			"";
		$i++;
		if ( $i >= $gNumUrls ) {
			break;
		}
	}
}
mysql_free_result($result);
?>
</div>

<script>
var sellabel = document.getElementById('sellabel');
if (sellabel.addEventListener) {
	sellabel.addEventListener('change', gotoLink, false);
}
else if (sellabel.attachEvent) {
	sellabel.attachEvent('onchange', gotoLink);
}
</script>

<script src="patchwork.js?n=<?php echo $gNumUrls ?>&l=<?php echo $gLabel ?>" async></script>
</body>
</html>

