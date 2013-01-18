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
	adjustTime(gStep);
	adjustImages();
}


function back() {
	adjustTime(-gStep);
	adjustImages();
}


function play() {
	gbPlay = true;
	document.getElementById('playbtn').style.display = "none";
	document.getElementById('pausebtn').style.display = "inline";
	loop();
}


function loop() {
	if ( gbPlay ) {
		if ( document.getElementById('time').value > 15000 ) {
			return;
		}
		forward();
		setTimeout(loop, 1000); // it takes about 1 second
	}
}


function pause() {
	gbPlay = false;
	document.getElementById('pausebtn').style.display = "none";
	document.getElementById('playbtn').style.display = "inline";
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
	// Unfortunately, we can NOT get the actual img src that we redirected to.
	// So we'll just do the redirect EVERY time.
    var src = image.src; // eg http://httparchive.org/frame.php?t=5000&wptid=130105_0_330&wptrun=3
	var iW = src.indexOf("&wptid=");
	if ( -1 != iW ) {
		image.src = "frame.php?t=" + gTime + src.substring(iW);
	}
}


function adjustTime(delta) {
	gTime += delta;
	document.getElementById('time').value = gTime;
}

function doSubmitTime() {
	var time = document.getElementById('time').value;
	document.location = "patchwork.php?t=" + time + "&n=" + gN;
}
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
$query = "select rank, pageid, url, wptid, wptrun from $gPagesTable where label='" . latestLabel() . "' and rank > 0 and rank <= " . (2*$gN) . " order by rank asc;";
$result = doQuery($query);
$wptServer = wptServer();
$i = 0;
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ! onBlackList($url) ) {
		$pageid = $row['pageid'];
		$wptid = $row['wptid'];
		$wptrun = $row['wptrun'];
		$rank = $row['rank'];
		echo "<div class=square><a href='viewsite.php?pageid=$pageid' title='$url' style='border-bottom: 0;'>" .
			"<img border=0 height=140 src='frame.php?t=$gTime&wptid=$wptid&wptrun=$wptrun'>" .
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

<script src="patchwork.js" async></script>
</body>
</html>

