var HARjson = 
<?php
require_once("utils.inc");

$wptid = getParam("wptid");
$wptrun = getParam("wptrun");
$bCached = getParam("cached", 0);
if ( $wptid && $wptrun ) {
	$target = wptHarFileUrl($wptid, $wptrun, $bCached);
	echo file_get_contents($target) . ";\n";
}
else if ( array_key_exists('u', $_GET) ) {
	dprint("ERROR: harviewer.js was accessed using the *deprecated* \"u\" querystring parameter.");
}
else if ( array_key_exists('f', $_GET) ) {
	dprint("ERROR: harviewer.js was accessed using the *deprecated* \"f\" querystring parameter.");
}
?>

