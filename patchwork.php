<?php 

require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");
require_once("urls.inc");
require_once("pages.inc");

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
BODY { padding: 0; margin: 0; width: 100%; }
.square { float: left; }
#time { margin: 0 1em; }
</style>
<script>
var gTime = <?php echo $gTime ?>;
var gN = <?php echo $gN ?>;
var gStep = <?php echo ( $gbMobile ? 1000 : 100 ) ?>;
function forward() {
	hideMessage();
	adjustTime(gStep);
	adjustImages();
}


function back() {
	hideMessage();
	adjustTime(-gStep);
	adjustImages();
}


function hideMessage() {
	//document.getElementById('msg').style.display = "none";
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

<?php echo uiHeader($gTitle); ?>

<div style="font-size: 2em; margin-top: 140px;">
&nbsp;&nbsp;
<a style="border-bottom: 0; font-size: 1.5em;" href="javascript:back()">-</a>
&nbsp;&nbsp;
<a style="border-bottom: 0; font-size: 1.5em;" href="javascript:forward()">+</a>
<form style="display:inline;" onsubmit="doSubmitTime();return false;">
<input id=time type=text size=5 value=<?php echo $gTime ?> style="text-align: right; border-color: #CCC; margin: 0 0 0.2em 0;"> ms
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

</body>
</html>

