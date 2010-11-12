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

require_once("settings.inc");

$gPagesTable = "pages";
$gRequestsTable = "requests";

// Use a dev version of the database tables if "dev/" is in the path.
$gbDev = ( strpos(getcwd(), "/dev/") || strpos(getcwd(), "/trunk") );
if ( $gbDev ) {
	$gPagesTable = "pagesdev";
	$gRequestsTable = "requestsdev";
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


// Return an array of the archive names.
function archiveNames() {
	global $gPagesTable, $gbDev, $ghHiddenArchives;

	$aNames = array();
	$query = "select archive from $gPagesTable group by archive order by archive asc;";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$archive = $row['archive'];
		if ( $gbDev || !array_key_exists($archive, $ghHiddenArchives) ) {
			array_push($aNames, $archive);
		}
	}
	mysql_free_result($result);

	return $aNames;
}


// Return HTML to create a select list of archive labels (eg, "Oct 2010", "Nov 2010").
function selectArchiveLabel($archive, $curLabel) {
	global $gPagesTable;

	$sSelect = "<select onchange='document.location=\"?a=$archive&l=\"+escape(this.options[this.selectedIndex].value)'>\n";

	$query = "select label, startedDateTime from $gPagesTable where archive = '$archive' group by label order by startedDateTime asc;";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$label = $row['label'];
		$epoch = $row['startedDateTime'];
		$sSelect .= "  <option value='$label'" . ( $curLabel == $label ? " selected" : "" ) . "> $label\n";
	}

	$sSelect .= "</select>\n";

	return $sSelect;
}


// Return an array of label names (in chrono order?) for an archive.
function archiveLabels($archive = "All") {
	global $gPagesTable;

	$query = "select label from $gPagesTable where archive = '$archive' group by label order by startedDateTime asc;";
	$result = doQuery($query);
	$aLabels = array();
	while ($row = mysql_fetch_assoc($result)) {
		$label = $row['label'];
		array_push($aLabels, $label);
	}

	return $aLabels;
}


// Return the latest (most recent) label for an archive 
// based on when the pages in that label were analyzed.
function latestLabel($archive) {
	global $gPagesTable;

	if ( ! $archive ) {
		return "";
	}

	$query = "select label from $gPagesTable where archive = '$archive' group by label order by startedDateTime desc;";
	return doSimpleQuery($query);
}



// Display a link (or not) to a URL.
function siteLink($url) {
	if ( onBlackList($url) ) {
		// no link, just url
		return shortenUrl($url);
	}
	else { 
		return "<a href='$url'>" . shortenUrl($url) . "</a>";
	}
}


// Return true if the specified URL (or a variation) is in the blacklist.
function onBlacklist($url) {
	global $ghBlackList;

	$bBlacklisted = true;

	// base blacklisting on hostname
	$aMatches = array();
	if ( $url && preg_match('/http[s]*:\/\/([^\/]*)/', $url, $aMatches) ) {
		$hostname = $aMatches[1];
		$bBlacklisted = array_key_exists($hostname, $ghBlackList);
	}

	return $bBlacklisted;
}

// Convert bytes to kB
function formatSize($num) {
	return round($num / 1024);
}


// add commas to a big number
function commaize($num) {
	$sNum = "$num";
	$len = strlen($sNum);

	if ( $len <= 3 ) {
		return $sNum;
	}

	return commaize(substr($sNum, 0, $len-3)) . "," . substr($sNum, $len-3);
}


// Logic to shorten a URL while retaining readability.
function shortenUrl($url) {
	$max = 48;

	if ( strlen($url) < $max ) {
		return $url;
	}

	// Strip the querystring.
	$iQueryString = strpos($url, "?");
	if ( $iQueryString ) {
		$url = substr($url, 0, $iQueryString);
	}

	if ( strlen($url) < $max ) {
		return $url;
	}

	$iDoubleSlash = strpos($url, "//");
	$iFirstSlash = strpos($url, "/", $iDoubleSlash+2);
	$iLastSlash = strrpos($url, "/");

	$sHostname = substr($url, 0, $iFirstSlash); // does NOT include trailing slash
	$sPath = substr($url, $iFirstSlash, $iLastSlash);
	$sFilename = substr($url, $iLastSlash);

	$url = $sHostname . "/..." . $sFilename;
	if ( strlen($url) < $max ) {
		// Add as much of the path as possible.
		$url = str_replace("/...", "/" . substr($sPath, 1, $max - strlen($url)) . "...", $url);
		return $url;
	}

	$url = substr($url, 0, $max-3) . "...";

	return $url;
}


// Given a website's URL return the full path to it's HAR file for a given archive & label.
function getHarPathname($archive, $label, $url) {
	// TODO - This assumes the HAR filename is $url without "http://" plus ".har" suffix.
	$aMatches = array();
	if ( $url && preg_match('/http[s]*:\/\/(.*)\//', $url, $aMatches) ) {
		return getHarDir($archive, $label) . $aMatches[1] . ".har";
	}

	return "";
}


// Return the directory of HAR files for a given archive & label.
function getHarDir($archive, $label) {
	return "./archives/$archive/" . ( $label ? "$label/" : "" );
}


// Delete all rows related to a specific page.
function purgePage($pageid) {
	global $gPagesTable, $gRequestsTable;

	$cmd = "delete from $gPagesTable where pageid = $pageid;";
	doSimpleCommand($cmd);
	$cmd = "delete from $gRequestsTable where pageid = $pageid;";
	doSimpleCommand($cmd);
}


//
//
// MYSQL
//
//
function doSimpleCommand($cmd) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$value = NULL;
	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doSimpleCommand: $cmd");
		$result = mysql_query($cmd, $link);
		if ( ! $result ) {
			dprint("ERROR in doSimpleCommand: '" . mysql_error() . "' for command: " . $cmd);
		}
	}
}


function doQuery($query) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$value = NULL;
	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doQuery: $query");
		$result = mysql_query($query, $link);
		if ( ! $result ) {
			dprint("ERROR in doQuery: '" . mysql_error() . "' for query: " . $query);
		}
		return $result;
	}

	return null;
}


function doSimpleQuery($query) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$value = NULL;
	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doSimpleQuery: $query");
		$result = mysql_query($query, $link);
		if ( ! $result ) {
			dprint("ERROR in doSimpleQuery: '" . mysql_error() . "' for query: " . $query);
		}
		$row = mysql_fetch_assoc($result);
		if ( $row ) {
			$aKeys = array_keys($row);
			$value = $row[$aKeys[0]];
		}
		mysql_free_result($result);
	}

	return $value;
}


function tableExists($tablename) {
	return ( $tablename == doSimpleQuery("show tables like '$tablename';") );
}


function createTables() {
	global $gPagesTable, $gRequestsTable;
	global $ghReqHeaders, $ghRespHeaders;

	if ( ! tableExists($gPagesTable) ) {
		$command = "create table $gPagesTable (" .
			"pageid int unsigned not null auto_increment" .
			", createDate int(10) unsigned not null" .
			", archive varchar (255) not null" .
			", label varchar (255) not null" .
			", harfile varchar (255)" .
			", wptid varchar (64) not null" .        // webpagetest.org id
			", wptrun int(2) unsigned not null" .    // webpagetest.org median #
			", title varchar (255) not null" .
			", url text" .
			", urlShort varchar (255)" .
			", urlHtml text" .
			", urlHtmlShort varchar (255)" .
			", startedDateTime int(10) unsigned" .
			", renderStart int(10) unsigned" .
			", onContentLoaded int(10) unsigned" .
			", onLoad int(10) unsigned" .
			", PageSpeed int(4) unsigned" .

			", reqTotal int(4) unsigned not null" .
			", reqHtml int(4) unsigned not null" .
			", reqJS int(4) unsigned not null" .
			", reqCSS int(4) unsigned not null" .
			", reqImg int(4) unsigned not null" .
			", reqFlash int(4) unsigned not null" .
			", reqJson int(4) unsigned not null" .
			", reqOther int(4) unsigned not null" .

			", bytesTotal int(10) unsigned not null" .
			", bytesHtml int(10) unsigned not null" .
			", bytesJS int(10) unsigned not null" .
			", bytesCSS int(10) unsigned not null" .
			", bytesImg int(10) unsigned not null" .
			", bytesFlash int(10) unsigned not null" .
			", bytesJson int(10) unsigned not null" .
			", bytesOther int(10) unsigned not null" .

			", numDomains int(4) unsigned not null" .
			", primary key (pageid)" .
			", unique key (startedDateTime, harfile)" .
			");";
		doSimpleCommand($command);
	}

	if ( ! tableExists($gRequestsTable) ) {
		$sColumns = "";
		$aColumns = array_values($ghReqHeaders);
		sort($aColumns);
		for ( $i = 0; $i < count($aColumns); $i++ ) {
			$column = $aColumns[$i];
			$sColumns .= ", $column varchar (255)";
		}
		$aColumns = array_values($ghRespHeaders);
		sort($aColumns);
		for ( $i = 0; $i < count($aColumns); $i++ ) {
			$column = $aColumns[$i];
			$sColumns .= ", $column varchar (255)";
		}

		$command = "create table $gRequestsTable (" .
			"requestid int unsigned not null auto_increment" .
			", pageid int unsigned not null" .

			", startedDateTime int(10) unsigned" .
			", time int(10) unsigned" .
			", method varchar (32)" .
			", url text" .
			", urlShort varchar (255)" .
			", redirectUrl text" .
			", redirectUrlShort varchar (255)" .
			", firstReq tinyint(1) not null" .
			", firstHtml tinyint(1) not null" .

			// req
			", reqHttpVersion varchar (32)" .
			", reqHeadersSize int(10) unsigned" .
			", reqBodySize int(10) unsigned" .
			", reqCookieLen int(10) unsigned not null".
			", reqOtherHeaders text" .

			// response
			", status int(10) unsigned" .	
			", respHttpVersion varchar (32)" .
			", respHeadersSize int(10) unsigned" .
			", respBodySize int(10) unsigned" .
			", respSize int(10) unsigned" .
			", respCookieLen int(10) unsigned not null".
			", mimeType varchar(255)" .
			", respOtherHeaders text" .

			// headers
			$sColumns .

			", primary key (requestid)" .
			", unique key (startedDateTime, pageid, urlShort)" .
			");";
		doSimpleCommand($command);
	}
}


// Escape ' and \ characters before inserting strings into MySQL.
function mysqlEscape($text) {
	return str_replace("'", "\\'", str_replace("\\", "\\\\", $text));
}


// Simple logging/debugging function.
function dprint($msg) {
	echo "DPRINT: $msg\n";
}

?>
