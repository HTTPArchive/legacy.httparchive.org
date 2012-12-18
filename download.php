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

require_once("utils.inc");
require_once("ui.inc");
require_once("pages.inc");


$gArchive = getParam('a');
$gLabel = getParam('l');
$gPageid = getParam('p');
$gFormat = getParam('format');


if ( $gPageid && "csv" == $gFormat ) {
	// request to download a CSV of an individual website's requests data
	header('Content-Type: application/octet-stream; name="httparchive.csv"'); 
	header('Content-Disposition: inline; filename="httparchive_page' . $gPageid . '.csv"');

	$aColumns = array("url", "mimeType", "method", "status", "time", "respSize", "reqCookieLen", "respCookieLen", "reqHttpVersion", "respHttpVersion", "req_accept", "req_accept_charset", "req_accept_encoding", "req_accept_language", "req_connection", "req_host", "req_referer", "resp_accept_ranges", "resp_age", "resp_cache_control", "resp_connection", "resp_content_encoding", "resp_content_language", "resp_content_length", "resp_content_location", "resp_content_type", "resp_date", "resp_etag", "resp_expires", "resp_keep_alive", "resp_last_modified", "resp_location", "resp_pragma", "resp_server", "resp_transfer_encoding", "resp_vary", "resp_via", "resp_x_powered_by");
	$sRows = implode(",", $aColumns);
	$sRows .= "\n";;

	$row = doRowQuery("select wptid, wptrun from $gPagesTable where pageid = $gPageid;");
	$page = pageFromWPT($row['wptid'], $row['wptrun']);
	$aResources = $page['resources'];
	foreach($aResources as $resource) {
		foreach ($aColumns as $column) {
			$sRows .= ( array_key_exists($column, $resource) ? '"' . $resource[$column] . '"' : "" ) . ","; // wrap in double quotes in case of commas
		}
		rtrim($sRows, ","); // remove trailing comma
		$sRows .= "\n";;
	}
	echo $sRows;
}

?>
