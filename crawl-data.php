<?php 
/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

This page provides information about the most recent crawl. It was
created to help Ilya download the crawl information including 
pageids & WebPagetest IDs. 

Querystring parameters:
  label - The label of the crawl, eg, "Dec 15 2014". 
  crawlid - The crawlid of the crawl, eg, 268. 
  format - The only option currently is "json". Default: "json"
  jsonp - Name of a callback function to pass the JSON object to. If
          not specified then the JSON object is returned.

If neither label nor crawlid is specified then the latest crawl is returned.

If the crawl is NOT finished, then only the crawl's meta info is returned.

If the crawl IS finished, then the "pages" property is an array containing 
an array of information about each page: pageid, wptid, & medianrun. With 
that you can construct the HA URL (from which you can find the crawl):
  http://httparchive.org/viewsite.php?pageid=[pageid]
As well as the HAR URL:
  http://httparchive.webpagetest.org/export.php?test=[wptid]&run=[medianrun]&cached=0&pretty=1

The most typical usage is simply:
  http://dev.httparchive.org/crawl-data.php

*/

require_once("ui.inc");
require_once("utils.inc");

if ( getParam("crawlid") ) {
	$crawl = getCrawlFromId(getParam("crawlid"));
}
else if ( getParam("label") ) {
	$crawl = getCrawl(getParam("label"));
}
else {
	// This is the latest crawl regardless of whether it's finished. 
	$crawl = latestCrawl(null, null, false);
}

if ( $crawl["finishedDateTime"] ) {
	// Add all the info about pages crawled.
	$crawl["pages"] = array();
	$query = "select pageid, wptid, wptrun from $gPagesTable where crawlid = ${crawl['crawlid']} order by pageid asc;";
	$result = doQuery($query);
	while ( $row = mysql_fetch_row($result) ) {
		array_push($crawl["pages"], $row);
	}
	mysql_free_result($result);
}

$response = json_encode($crawl);
$jsonp = getParam("jsonp");
if ( $jsonp ) {
	echo "$jsonp($response);";
}
else {
	echo $response;
}
?>
