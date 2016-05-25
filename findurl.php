<?php
/*
 * 
 * NOTE! group_concat will only return a small number of characters by default (1024). 
 * You might have to execute this command:
 *     SET GLOBAL group_concat_max_len = 11000;
 * 
 */
require_once("utils.inc");
header('Content-Type: text/javascript'); 

$maxResults = 50;
$maxLimit = 200; // we LIMIT more than the max results so that, after whittling, we have enough results

$term = getParam("term");
if ( ! $term ) {
    return; // no need to run anything - May be, return 'warn' in dev mode
}
$term = strtolower($term); // always search lower case (esp. a problem on iOS)

// First, get all the urlhashes from the "urls" table that match the search term.
// We CAN'T do ordering here because hashes are shared by multiple URLs,
// and all we're transferring from here are the hashes.
// This doesn't work because ORDER BY doesn't work and so we miss the most popular urlhashes.
// $query = "select group_concat(urlhash order by rank asc) from $gUrlsTable where (urlOrig like '%$term%' or urlFixed like '%$term%');";
$query = "select distinct(urlhash) from $gUrlsTable where (urlOrig like '%$term%' or urlFixed like '%$term%') order by rank asc;";
$result = doQuery($query);
$sUrlhashes = "";
while ( $row = mysql_fetch_assoc($result) ) {
	$sUrlhashes .= $row['urlhash'] . ",";
}
mysql_free_result($result);


// It's possible the list ends in "," which is bad (eg, if urlhash is null).
if ( "," === substr($sUrlhashes, -1) ) {
	$sUrlhashes = substr($sUrlhashes, 0, -1);
}

// It's possible that we don't have any results for some of these URLs:
// they could have a low rank (> 300K) or always return errors.
// So we have to look for actual results.
// The tricky part of this is doing "group by url" but figuring out what to order on.
// If we order by "rank asc" then NULL gets listed first.
// We fix that by ordering by "brank, rank asc" but that might not match the LATEST results - only the aggregate.
// So it's possible we'll put something too high in the order that USED TO BE ranked but is now NULL.
// TODO - better ordering?
// TODO - could also save the newest pageid to urls table (altho is that mobile or desktop?) or just a boolean bAreThereAnyResultsForThisURL
$query = "select url, urlhash, max(pageid) as pageid, min(rank is null) as brank, min(rank) as rank from $gPagesTable " .
	"where " . dateRange(true) . " and archive='$gArchive' and urlhash in ($sUrlhashes) and urlShort like '%$term%' group by url order by brank, rank asc limit $maxLimit;";
$result = doQuery($query);
$numUrls = mysql_num_rows($result);

// Only return $maxResults results.
// If there are more results, return a message with the remaining number.
$aSites = array();
while ( count($aSites) < $maxResults && $row = mysql_fetch_assoc($result) ) {
	$url = $row['url'];
	array_push($aSites, array("label" => $url, "value" => $url, "data-urlhash" => $row['urlhash'], "data-pageid" => $row['pageid']));
}
mysql_free_result($result);

if ( $numUrls > count($aSites) ) {
	$remaining = $numUrls - count($aSites);
	array_push($aSites, array("label" => ( $remaining > 100 ? "100+ more URLs" : "$remaining more URLs" ) . ", refine further", "value" => "0"));
}

//echo JSON to our jQueryUI auto-complete box
$response = json_encode($aSites);

$jsonp = getParam("jsonp");
if ( $jsonp ) {
	echo "$jsonp($response);";
}
else {
	echo $response;
}
?>
