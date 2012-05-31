<?php
require_once("utils.inc");

define("MIN_RESULTS", 12); // TODO - move it to conf file

$term = getParam("term");
if ( ! $term ) {
    return; // no need to run anything - May be, return 'warn' in dev mode
}

$sites = array();
$query = "select urlShort, max(pageid) as pageid from $gPagesTable where archive='$gArchive' and urlShort like '%$term%' group by urlShort order by urlShort asc limit 101;";
$result = doQuery($query);
$numUrls = mysql_num_rows($result);
if ($numUrls > MIN_RESULTS) {
    array_push($sites, array("label" => ( $numUrls > 100 ? "100+ URLs" : "$numUrls URLs" ) . ", refine further", "value" => "0"));
} else {
    // less then min results - so we'll give the list of urls
    while ( $row = mysql_fetch_assoc($result) ) {
        $url = $row['urlShort'];
		$pageid = $row['pageid'];
        array_push($sites, array("label" => $url, "value" => $url, "data-pageid" => $pageid));
    }
}

mysql_free_result($result);

//echo JSON to our jQueryUI auto-complete box
$response = json_encode($sites);
echo $response;
?>
