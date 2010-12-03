<?php
/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

set_time_limit(0);

require_once("../settings.inc");
require_once("../utils.php");

$gArchive = "All";
$date = getdate();
$gLabel = $date[0];
$gMaxRetry = 3;

$gMarks = array();
$gAggTimes = array();
$gAggCounts = array();

$gPagesTable = "pages";
$gRequestsTable = "requests";
$gStatusTable = "status";

// Use a dev version of the database tables if "dev/" or "trunk/" is in the path.
$gbDev = ( strpos(getcwd(), "/dev/") || strpos(getcwd(), "/trunk") );
if ( $gbDev ) {
	$gPagesTable = "pagesdev";
	$gRequestsTable = "requestsdev";
  $gStatusTable = "statusdev";
}

// Hide archives while we're importing them.
$ghHiddenArchives = array(
						  "Fortune 1000" => 1
						  );


// mapping of headers to DB fields
// IF YOU CHANGE THESE YOU HAVE TO REBUILD THE REQUESTS TABLE!!!!!!!!!!!!!!!!!!!!!!!!!!
$ghReqHeaders = array(
					  "accept" => "req_accept",
					  "accept-charset" => "req_accept_charset",
					  "accept-encoding" => "req_accept_encoding",
					  "accept-language" => "req_accept_language",
					  "connection" => "req_connection",
					  "host" => "req_host",
					  "if-modified-since" => "req_if_modified_since",
					  "if-none-match" => "req_if_none_match",
					  "referer" => "req_referer",
					  "user-agent" => "req_user_agent"
					  );

$ghRespHeaders = array(
					   "accept-ranges" => "resp_accept_ranges",
					   "age" => "resp_age",
					   "cache-control" => "resp_cache_control",
					   "connection" => "resp_connection",
					   "content-encoding" => "resp_content_encoding",
					   "content-language" => "resp_content_language",
					   "content-length" => "resp_content_length",
					   "content-location" => "resp_content_location",
					   "content-type" => "resp_content_type",
					   "date" => "resp_date",
					   "etag" => "resp_etag",
					   "expires" => "resp_expires",
					   "keep-alive" => "resp_keep_alive",
					   "last-modified" => "resp_last_modified",
					   "location" => "resp_location",
					   "pragma" => "resp_pragma",
					   "server" => "resp_server",
					   "transfer-encoding" => "resp_transfer_encoding",
					   "vary" => "resp_vary",
					   "via" => "resp_via",
					   "x-powered-by" => "resp_x_powered_by"
					   );

// map a human-readable title to each DB column
// (right now just $gPagesTable)
$ghColumnTitles = array (
						 "onLoad" => "load time",
						 "renderStart" => "start render",
						 "PageSpeed" => "Page Speed score",
						 "reqTotal" => "total reqs",
						 "bytesTotal" => "total xfer size",
						 "reqHtml" => "html reqs",
						 "bytesHtml" => "html xfer size",
						 "reqJS" => "JS reqs",
						 "bytesJS" => "JS xfer size",
						 "reqCSS" => "CSS reqs",
						 "bytesCSS" => "CSS xfer size",
						 "reqImg" => "image reqs",
						 "bytesImg" => "image xfer size",
						 "reqFlash" => "Flash reqs",
						 "bytesFlash" => "Flash xfer size",
						 "numDomains" => "domains"
						 );
;

// Don't link to some websites.
$ghBlackList = array(
					 "adultfriendfinder.com" => 1,
					 "www.adultfriendfinder.com" => 1,
					 "xvideos.com" => 1,
					 "www.xvideos.com" => 1,
					 "pornhub.com" => 1,
					 "www.pornhub.com" => 1,
					 "xhamster.com" => 1,
					 "www.xhamster.com" => 1,
					 "youporn.com" => 1,
					 "www.youporn.com" => 1,
					 "tube8.com" => 1,
					 "www.tube8.com" => 1,
					 "xnxx.com" => 1,
					 "www.xnxx.com" => 1,
					 "youjizz.com" => 1,
					 "www.youjizz.com" => 1,
					 "xvideoslive.com" => 1,
					 "www.xvideoslive.com" => 1,
					 "spankwire.com" => 1,
					 "www.spankwire.com" => 1,
					 "hardsextube.com" => 1,
					 "www.hardsextube.com" => 1,
					 "keezmovies.com" => 1,
					 "www.keezmovies.com" => 1,
					 "tnaflix.com" => 1,
					 "www.tnaflix.com" => 1,
					 "megaporn.com" => 1,
					 "www.megaporn.com" => 1,
					 "cam4.com" => 1,
					 "www.cam4.com" => 1,
					 "slutload.com" => 1,
					 "www.slutload.com" => 1,
					 "empflix.com" => 1,
					 "www.empflix.com" => 1,
					 "pornhublive.com" => 1,
					 "www.pornhublive.com" => 1,
					 "youjizzlive.com" => 1,
					 "www.youjizzlive.com" => 1,
					 "pornhost.com" => 1,
					 "www.pornhost.com" => 1,
					 "redtube.com" => 1,
					 "www.redtube.com" => 1
					 );

// global options
$video = true;
$private = false;
$docComplete = true;
$runs = 9;
$fvonly = true;
$server = 'http://www.webpagetest.org/';

// list of locations to use
$locations = array();
//$locations[] = 'Dulles_IE7';
//$locations[] = 'Dulles_IE8';
$locations[] = 'G_Dulles_IE8';
//$locations[] = 'NewYork_IE8';
//$locations[] = 'Chicago_IE7';
//$locations[] = 'SanJose';
//$locations[] = 'China';
//$locations[] = 'NZ';
//$locations[] = 'UK';
//$locations[] = 'Paris_IE7';
//$locations[] = 'Amsterdam';
//$locations[] = 'Frankfurt';

// Create all the tables if they are not there.
createTables();

$ghReqOtherHeaders = array();
$ghRespOtherHeaders = array();

