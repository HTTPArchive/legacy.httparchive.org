var HARjson = 
<?php
if ( array_key_exists('u', $_GET) ) {
	$target = $_GET['u'];
	echo file_get_contents($target) . ";\n";
}
else if ( array_key_exists('f', $_GET) ) {
	// TODO - remove this - not used since March 24, 2011
	require_once("utils.inc");
	$target = $_GET['f'];
	echo getHarFileContents($target) . ";\n";
}
?>

