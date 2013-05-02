<?php 
require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");

$gTitle = "Render Patchwork";
$gCurTime = getParam('t', '0'); // the current time frame (0.1, 0.2, 0.3, etc.) in milliseconds
$gNumUrls = getParam('n', 100); // number of top sites to look at
if ( $gNumUrls <= 0 || 100 < $gNumUrls ) {
	// constrain the # of images
	$gNumUrls = 100;
}
$gLabel2 = getParam('l2');        // crawl label
if ( ! $gLabel2 ) {
	$gLabel2 = latestLabel(); // only do this if we have to
}
$gLabel1 = getParam('l1');        // crawl label
if ( ! $gLabel1 ) {
	// 1 year earlier
	$gLabel1 = getPrevLabel($gLabel2, $gArchive, curDevice(), 31104000); // only do this if we have to (360*24*60*60)
}
$gMinStep = ( $gbMobile ? 1000 : 100 ); // finest granularity of screenshots for this browser
$gStep = getParam('step', ( $gbMobile ? 1000 : 1000 ));  // time interval to step during playback
$gW = getParam('w', ($gbMobile ? 50 : 100)); // normal dimensions are 138x200 or 90x200
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
var gNumStarted = 0;  // how many pages have started rendering
var gNumFinished = 0; // how many pages have finished rendering

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
		if ( (gCurTime - gStep) >= 0 ) {
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


// This is the function that gets called when the async patchwork.js script is loaded.
function doPatchwork() {
	toggleBusy("none");
	gotoTime(gCurTime);
}


function adjustImages() {
	var aIds = ['allthumbs1', 'allthumbs2'];
	for ( var j = 0; j < aIds.length; j++ ) {
		var id = aIds[j];
		var container = document.getElementById(id);
		var aImages = container.getElementsByTagName('img');
		var len = aImages.length;
		for ( var i = 0; i < len; i++ ) {
			var image = aImages[i];
			adjustImage(image);
		}
	}
	countStarted();
}


function adjustImage(image) {
	var pageid = image.id;
	var hFrames = hPages[pageid];
	var aInfo = hPageInfo[pageid];
	if ( ! hFrames ) {
		dprint("ERROR: Pageid " + pageid + " wasn't found in hPages.");
	}
	else if ( ! aInfo ) {
		dprint("ERROR: Pageid " + pageid + " wasn't found in hPageInfo.");
	}
	else { 
		// Iterate backwards through the screenshots to find the right one to show.
		// Slightly more complicated in order to handle when the "step" interval is greater than the filmstrip interval.
		for ( var t = gCurTime; t >= 0; t -= gMinStep ) {
			if ( hFrames[t] ) {
				var f = "0000" + parseInt(t/100);
				f = f.substring(f.length-4); // eg, "0025" is 2500 ms
				image.src = "<?php echo $wptServer ?>thumbnail.php?test=" + aInfo[0] + 
					"&width=200&file=video_" + aInfo[1] + "/frame_" + f + ".jpg";
				return;
			}
		}
	}
}


function countStarted() {
	var aIds = ['allthumbs1', 'allthumbs2'];
	for ( var j = 0; j < aIds.length; j++ ) {
		var id = aIds[j];
		var container = document.getElementById(id);
		var aImages = container.getElementsByTagName('img');
		var len = aImages.length;
		gNumStarted = 0;
		for ( var i = 0; i < len; i++ ) {
			var image = aImages[i];
			var pageid = image.id;
			if ( -1 === image.src.indexOf("0000.jpg") && (!gbMobile || pageid >= 12217 || -1 === image.src.indexOf("0010.jpg")) ) {
				gNumStarted++
			}
		}
		document.getElementById(id+'started').innerHTML = parseInt((100*gNumStarted/gNumUrls)+0.5) + "% started rendering";
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


function getLabel(id) {
	var sel = document.getElementById(id);
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

	var aIds = ['allthumbs1', 'allthumbs2'];
	for ( var j = 0; j < aIds.length; j++ ) {
		var allthumbs = document.getElementById(aIds[j]);
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
}


function gotoLink() {
	document.location = "patchwork.php?t=" + document.getElementById('time').value + "&w=" + getSize() + "&l1=" + getLabel('label1') + "&l2=" + getLabel('label2') + "&n=" + gNumUrls;
}


function toggleBusy(val) {
	var busy = document.getElementById('busy');
	val = ( val ? val : ( "none" == busy.style.display ? "block" : "none" ) );
	busy.style.display = val;
}


function dprint(msg) {
	if ( console && console.log ) {
		console.log(msg);
	}
}
</script>
</head>

<body>
<div id=busy style="display: none; font-size: 1.5em; color: #DDD; padding: 8px 0 8px 4em; position: fixed; background: #000; width: 100%;">
downloading thumbnails... <img src="images/busy.gif" style="vertical-align: middle;">
</div>
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
</form>
<a href="javascript:gotoLink()" style="margin-left: 1em; font-size: 0.8em;" class=txt>link</a>
</div>

<?php 
// Figure out which crawl is earliest:
$earliestLabel = doSimpleQuery("select label from crawls where (label = '$gLabel1' or label = '$gLabel2') and location = '" . curDevice() . "' order by minPageid asc limit 1;");
$bChrono = ( $earliestLabel == $gLabel1 );

// Find the topmost URLs in both crawls:
$limitgoogle = "(url = 'http://www.google.com/' OR url not like '%://www.google.%')"; // There are 10+ sites that all look the same from Google intl sites
$maxRank = 5 * $gNumUrls; // we get back MORE results than needed so we can filter out adult content
$query = "select url, min(pageid) as minid, max(pageid) as maxid, count(*) as num from $gPagesTable, $gUrlsTable as u where (label = '$gLabel1' or label = '$gLabel2') and url=urlOrig and u.rank > 0 and u.rank < $maxRank and $limitgoogle group by url having num=2 order by u.rank asc;";
$result = doQuery($query);
$i = 0;
$imgs1 = "";
$imgs2 = "";
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	$minid = $row['minid'];
	$maxid = $row['maxid'];
	if ( ! isAdultContent($url) ) {
		$imgs1 .= getImgHtml(($bChrono ? $minid : $maxid), $url);
		$imgs2 .= getImgHtml(($bChrono ? $maxid : $minid), $url);

		$i++;
		if ( $i >= $gNumUrls ) {
			break;
		}
	}
}
mysql_free_result($result);

function getImgHtml($pageid, $url) {
	global $gH, $gW, $gbMobile;
	return "<div style='height: {$gH}px; width: {$gW}px; float: left; background: #FFF;'>" . // show white in case of missing images
		"<a href='viewsite.php?pageid=$pageid' title='$url' class=img>" .
		"<img id=$pageid style='border-width: 0; height: {$gH}px; width: {$gW}px;' src='images/thumbnail-" . ( $gbMobile ? "iphone" : "ie" ) . ".jpg'>" .
		"</a>" .
		"</div>" .
		"\n";
}
?>

<table style="width: 100%; border-bottom: 0;">
<tr>
<td style="width: 50%; padding: 0; padding-left: 2em;">
<div style="margin-left: 3em;">
	<?php echo selectArchiveLabel($gArchive, $gLabel1, true, false, 'label1'); ?>
<span id=allthumbs1started style="color: #DDD; vertical-align: super; margin-left: 1em;"></span>
</div>
<div id=allthumbs1>
<?php echo $imgs1 ?>
</div>
</td>
<td style="width: 50%; padding: 0; padding-left: 2em;">
<div style="margin-left: 3em;">
	<?php echo selectArchiveLabel($gArchive, $gLabel2, true, false, 'label2'); ?>
<span id=allthumbs2started style="color: #DDD; vertical-align: super; margin-left: 1em;"></span>
</div>
<div id=allthumbs2>
<?php echo $imgs2 ?>
</div>
</td>
</tr>
</table>

<script>
var sellabel1 = document.getElementById('label1');
var sellabel2 = document.getElementById('label2');
if (sellabel1.addEventListener) {
	sellabel1.addEventListener('change', gotoLink, false);
	sellabel2.addEventListener('change', gotoLink, false);
	window.addEventListener('load', countStarted, false);
}
else if (sellabel1.attachEvent) {
	sellabel1.attachEvent('onchange', gotoLink);
	sellabel2.attachEvent('onchange', gotoLink);
	window.attachEvent('onload', countStarted);
}
</script>

<script>
var hPages = {}; // this gets populated by patchwork.js
var hPageInfo = {}; // this gets populated by patchwork.js
var msMax = 0;
toggleBusy("block");
</script>
<script src="patchwork.js?n=<?php echo $gNumUrls ?>&l1=<?php echo $gLabel1 ?>&l2=<?php echo $gLabel2 ?>&callback=doPatchwork" async></script>
</body>
</html>

