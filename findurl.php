<?php
require_once("utils.inc");
header('Content-Type: text/javascript'); 

$maxResults = 50;
$maxLimit = 500;

$term = getParam("term");
if ( ! $term ) {
    return; // no need to run anything - May be, return 'warn' in dev mode
}

$query = "select urlOrig, rank from $gUrlsTable where (urlOrig like '%$term%' or urlFixed like '%$term%') group by urlOrig order by rank asc limit $maxLimit;";
$result = doQuery($query);

// Only return $maxResults results.
// If there are more results, return a message with the remaining number.
// We want to return the HIGHEST RANKED results first. Unfortunately, "asc" returns NULL first, 
// so we have to wade through those in one array, and store the other results in a different array.
$aRankedSites = array();
$aUnrankedSites = array();
$numUrls = mysql_num_rows($result);
while ( $row = mysql_fetch_assoc($result) ) {
	$url = $row['urlOrig'];
	$rank = $row['rank'];

	if ( null == $rank ) {
		if ( count($aUnrankedSites) < $maxResults ) {
			array_push($aUnrankedSites, array("label" => $url, "value" => $url, "data-url" => $url));
		}
	}
	else if ( count($aRankedSites) < $maxResults ) {
		array_push($aRankedSites, array("label" => $url, "value" => $url, "data-url" => $url));
	}
	else {
		break;
	}
}

if ( count($aRankedSites) < $maxResults ) {
	// add some UNRANKED results to make up the difference
	array_splice($aRankedSites, count($aRankedSites), $maxResults, $aUnrankedSites);
}		

if ( $numUrls > $maxResults ) {
	$remaining = $numUrls - $maxResults;
	array_push($aRankedSites, array("label" => ( $remaining > 100 ? "100+ more URLs" : "$remaining more URLs" ) . ", refine further", "value" => "0"));
}
mysql_free_result($result);

//echo JSON to our jQueryUI auto-complete box
$response = json_encode($aRankedSites);

$jsonp = getParam("jsonp");
if ( $jsonp ) {
	echo "$jsonp($response);";
}
else {
	echo $response;
}
?>
