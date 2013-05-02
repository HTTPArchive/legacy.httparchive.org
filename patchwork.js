<?php 
require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");


// Return an array of frame times for each page.
$gNumUrls = getParam('n');
$gLabel1 = getParam('l1');
if ( ! $gNumUrls || ! $gLabel1 ) {
	exit();
}
$gLabel2 = getParam('l2');
$gCallback = getParam('callback');
$wptServer = wptServer();
$msMax = 0;

// Find the topmost URLs in both crawls:
$limitgoogle = "(url = 'http://www.google.com/' OR url not like '%://www.google.%')"; // There are 10+ sites that all look the same from Google intl sites
$maxRank = 5 * $gNumUrls; // we get back MORE results than needed so we can filter out adult content
$query = "select url, count(*) as num from $gPagesTable, $gUrlsTable as u where (label = '$gLabel1' or label = '$gLabel2') and url=urlOrig and u.rank > 0 and u.rank < $maxRank and $limitgoogle group by url having num=2 order by u.rank asc;";
$result = doQuery($query);
$i = 0;
$sUrls = "";
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ! isAdultContent($url) ) {
		$sUrls .= ", '$url'";
		$i++;
		if ( $i >= $gNumUrls ) {
			break;
		}
	}
}
$sUrls = substr($sUrls, 1); // remove leading ","
mysql_free_result($result);

// Display a thumbnail of the Top N websites at a certain time in the loading process.
$query = "select pageid, url, wptid, wptrun from $gPagesTable, $gUrlsTable as u where label='$gLabel1' and urlOrig=url and u.rank > 0 and u.rank <= $maxRank and url in ($sUrls) order by u.rank asc;";
$result = doQuery($query);
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	$pageid = $row['pageid'];
	$wptid = $row['wptid'];
	$wptrun = $row['wptrun'];

	$xmlurl = "{$wptServer}xmlResult.php?test=$wptid";
	$xmlstr = fetchUrl($xmlurl);
	$xml = new SimpleXMLElement($xmlstr);
	$frames = $xml->data->run[($wptrun - 1)]->firstView->videoFrames;
	if ( $frames->frame ) {
		$sJS = "";
		foreach($frames->frame as $frame) {
			$ms = floatval($frame->time) * 1000;
			$msMax = max($msMax, $ms);
			$sJS .= ( $sJS ? ", " : "" ) . "$ms: 1"; // must NOT end with a comma - poop
		}
		echo "hPages[$pageid] = {" . $sJS . "};\n";
	}
}
mysql_free_result($result);

// Display a thumbnail of the Top N websites at a certain time in the loading process.
$query = "select pageid, url, wptid, wptrun from $gPagesTable, $gUrlsTable as u where label='$gLabel2' and urlOrig=url and u.rank > 0 and u.rank <= $maxRank and url in ($sUrls) order by u.rank asc;";
$result = doQuery($query);
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	$pageid = $row['pageid'];
	$wptid = $row['wptid'];
	$wptrun = $row['wptrun'];

	$xmlurl = "{$wptServer}xmlResult.php?test=$wptid";
	$xmlstr = fetchUrl($xmlurl);
	$xml = new SimpleXMLElement($xmlstr);
	$frames = $xml->data->run[($wptrun - 1)]->firstView->videoFrames;
	if ( $frames->frame ) {
		$sJS = "";
		foreach($frames->frame as $frame) {
			$ms = floatval($frame->time) * 1000;
			$msMax = max($msMax, $ms);
			$sJS .= ( $sJS ? ", " : "" ) . "$ms: 1"; // must NOT end with a comma - poop
		}
		echo "hPages[$pageid] = {" . $sJS . "};\n";
	}
}
mysql_free_result($result);



echo "\nmsMax = Math.max(msMax, $msMax);\n" .
	( $gCallback ? "$gCallback();\n" : "" );
?>
