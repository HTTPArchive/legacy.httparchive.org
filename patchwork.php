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
BODY { background: #000; padding: 0; margin: 0; width: 100%; }
.square { float: left; }
#time { margin: 0 1em; }
</style>
<script>
var gTime = <?php echo $gTime ?>;
function forward() {
	hideMessage();
	adjustTime(100);
	adjustImages();
}


function back() {
	hideMessage();
	adjustTime(-100);
	adjustImages();
}


function hideMessage() {
	document.getElementById('msg').style.display = "none";
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
	document.getElementById('time').innerHTML = gTime;
}
</script>
</head>

<body>
<div style="font-size: 3em;">
&nbsp;&nbsp;
<a style="border-bottom: 0; color: #FFF" href="javascript:back()">-</a>
&nbsp;&nbsp;
<a style="border-bottom: 0; color: #FFF" href="javascript:forward()">+</a>
<span id=time><?php echo $gTime ?></span>
<span id=msg style="font-size: 0.7em; margin-left: 1em; color: gold">click "+" to see the screens render</span>
</div>

<div id=allthumbs>
<?php
// Display a thumbnail of the Top N websites at a certain time in the loading process.
$query = "select pageid, url, wptid, wptrun from $gPagesTable where label='" . latestLabel() . "' and rank <= $gN order by rank asc";
$result = doQuery($query);
$wptServer = wptServer();
while ($row = mysql_fetch_assoc($result)) {
	$pageid = $row['pageid'];
	$wptid = $row['wptid'];
	$wptrun = $row['wptrun'];
	$url = $row['url'];
	echo "<div class=square><a href='viewsite.php?pageid=$pageid' title='$url' style='border-bottom: 0;'>" .
		"<img border=0 width=" . ( $gbMobile ? "93" : "200" ) . " height=140 src='frame.php?t=$gTime&wptid=$wptid&wptrun=$wptrun'>" .
		"</a></div>\n";
}
mysql_free_result($result);
?>
</div>

</body>
</html>

