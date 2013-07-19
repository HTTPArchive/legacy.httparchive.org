<?php
require_once("utils.inc");
header('Content-Type: text/javascript'); 

$maxResults = 50;
$maxLimit = 500; // we LIMIT more than the max results so that, after whittling, we have enough results

$term = getParam("term");
if ( ! $term ) {
    return; // no need to run anything - May be, return 'warn' in dev mode
}

// First, get all the urlhashes from the "urls" table that match the search term.
$query = "select urlhash from $gUrlsTable where (urlOrig like '%$term%' or urlFixed like '%$term%') group by urlhash limit $maxLimit;";
$result = doQuery($query);
$aUrlhashes = array();
while ( $row = mysql_fetch_assoc($result) ) {
	array_push($aUrlhashes, $row['urlhash']);
}
mysql_free_result($result);

// Second, get the newest pageids for each URL matching the search term AND the urlhashes.
$query = "select urlShort, max(pageid) as pageid, rank from $gPagesTable where archive='$gArchive' and urlhash in (" .
	implode(",", $aUrlhashes) . ") and urlShort like '%$term%' group by urlShort order by rank asc limit $maxLimit;";
$result = doQuery($query);


// Only return $maxResults results.
// If there are more results, return a message with the remaining number.
// We want to return the HIGHEST RANKED results first. Unfortunately, "asc" returns NULL first, 
// so we have to wade through those in one array, and store the other results in a different array.
$aRankedSites = array();
$aUnrankedSites = array();
$numUrls = mysql_num_rows($result);
while ( $row = mysql_fetch_assoc($result) ) {
	$url = $row['urlShort'];
	$pageid = $row['pageid'];
	$rank = $row['rank'];

	if ( null == $rank ) {
		if ( count($aUnrankedSites) < $maxResults ) {
			array_push($aUnrankedSites, array("label" => $url, "value" => $url, "data-pageid" => $pageid));
		}
	}
	else if ( count($aRankedSites) < $maxResults ) {
		array_push($aRankedSites, array("label" => $url, "value" => $url, "data-pageid" => $pageid));
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
