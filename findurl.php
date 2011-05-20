<?php
require_once("utils.php");

define("MIN_RESULTS", 12); // TODO - move it to conf file

$term = getParam("term");
if ( ! $term ) {
    return; // no need to run anything - May be, return 'warn' in dev mode
}

$sites = array();
// TODO - This won't work if/when we support https URLs. 
$query = "select urlShort from $gPagesTable where ( urlShort like 'http://www.$term%' or urlShort like 'http://$term%' or urlShort like '$term%' ) group by urlShort order by urlShort asc limit " . ( MIN_RESULTS + 1 ) . ";";
$result = doQuery($query);
$numUrls = mysql_num_rows($result);
if ($numUrls > MIN_RESULTS) {
    array_push($sites, array("label" => "refine further", "value" => "tooMany"));
} else {
    // less then min results - so we'll give the list of urls
    while ( $row = mysql_fetch_assoc($result) ) {
        $url = $row['urlShort'];
        array_push($sites, array("label" => $url, "value" => $url));
    }
}

mysql_free_result($result);

//echo JSON to our jQueryUI auto-complete box
$response = json_encode($sites);
echo $response;
?>
