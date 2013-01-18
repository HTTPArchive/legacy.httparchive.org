<?php 
require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");


// Return an array of frame times for each page.
$gN = getParam('n');
$crawl = getParam('crawl');
if ( ! $gN || ! $crawl ) {
	exit();
}


// Ask for twice as many as needed so we can filter out adult sites.
$query = "select pageid, url, wptid, wptrun from $gPagesTable where label='$crawl' and rank > 0 and rank <= " . (2*$gN) . " order by rank asc;";
$result = doQuery($query);

$wptServer = wptServer();
$i = 0;
$msMax = 0;
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ! onBlackList($url) ) {
		$pageid = $row['pageid'];
		$wptid = $row['wptid'];
		$wptrun = $row['wptrun'];

		$xmlurl = "{$wptServer}xmlResult.php?test=$wptid";
		$xmlstr = file_get_contents($xmlurl);
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
		
		$i++;
		if ( $i >= $gN ) {
			break;
		}
	}
}
mysql_free_result($result);
echo "\nvar msMax = $msMax;\n";
?>
