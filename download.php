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

$gArchive = getParam('a');
$gLabel = getParam('l');
$gPageid = getParam('p');
$gFormat = getParam('format');


if ( $gPageid && "csv" == $gFormat ) {
	// request to download a CSV of an individual website's requests data
	header('Content-Type: application/octet-stream; name="httparchive.csv"'); 
	header('Content-Disposition: inline; filename="httparchive_page' . $gPageid . '.csv"');

	$sRows = "";

	$sRows .= "URL,mime_type,method,status,time(ms),resp_Size(kB),req_Cookie_Len(bytes),resp_Cookie_Len(bytes),req_Http_Ver,resp_Http_Ver,req_Accept,req_Accept-Charset,req_Accept-Encoding,req_Accept-Language,req_Connection,req_Host,req_Referer,resp_Accept-Ranges,resp_Age,resp_Cache-Control,resp_Connection,resp_Content-Encoding,resp_Content-Language,resp_Content-Length,resp_Content-Location,resp_Content-Type,resp_Date,resp_Etag,resp_Expires,resp_Keep-Alive,resp_Last-Modified,resp_Location,resp_Pragma,resp_Server,resp_Transfer-Encoding,resp_Vary,resp_Via,resp_X-Powered-By\n";

	$query = "select * from $gRequestsTable where pageid = '$gPageid';";
	$result = doQuery($query);
	if ( $result ) {
		$iRow = 0;
		while ($row = mysql_fetch_assoc($result)) {
			$iRow++;
			$sRow = $row['url'];
			$sRow .= "," . tdStat($row, "mimeType", "", "nobr");
			$sRow .= "," . tdStat($row, "method", "", "");
			$sRow .= "," . tdStat($row, "status");
			$sRow .= "," . tdStat($row, "time");
			$sRow .= "," . tdStat($row, "respSize", "kB");
			$sRow .= "," . tdStat($row, "reqCookieLen", "b");
			$sRow .= "," . tdStat($row, "respCookieLen", "b");
			$sRow .= "," . tdStat($row, "reqHttpVersion", "", "");
			$sRow .= "," . tdStat($row, "respHttpVersion", "", "");
			$sRow .= "," . tdStat($row, "req_accept", "snip", "nobr");
			$sRow .= "," . tdStat($row, "req_accept_charset", "", "");
			$sRow .= "," . tdStat($row, "req_accept_encoding", "", "nobr");
			$sRow .= "," . tdStat($row, "req_accept_language", "", "");
			$sRow .= "," . tdStat($row, "req_connection", "", "");
			$sRow .= "," . tdStat($row, "req_host", "", "");
			$sRow .= "," . tdStat($row, "req_referer", "url", "");
			$sRow .= "," . tdStat($row, "resp_accept_ranges", "", "");
			$sRow .= "," . tdStat($row, "resp_age", "", "");
			$sRow .= "," . tdStat($row, "resp_cache_control", "", "");
			$sRow .= "," . tdStat($row, "resp_connection", "", "");
			$sRow .= "," . tdStat($row, "resp_content_encoding", "", "");
			$sRow .= "," . tdStat($row, "resp_content_language", "", "");
			$sRow .= "," . tdStat($row, "resp_content_length", "", "");
			$sRow .= "," . tdStat($row, "resp_content_location", "url", "");
			$sRow .= "," . tdStat($row, "resp_content_type", "", "");
			$sRow .= "," . tdStat($row, "resp_date", "", "nobr");
			$sRow .= "," . tdStat($row, "resp_etag", "", "");
			$sRow .= "," . tdStat($row, "resp_expires", "", "nobr");
			$sRow .= "," . tdStat($row, "resp_keep_alive", "", "");
			$sRow .= "," . tdStat($row, "resp_last_modified", "", "nobr");
			$sRow .= "," . tdStat($row, "resp_location", "url", "");
			$sRow .= "," . tdStat($row, "resp_pragma", "", "");
			$sRow .= "," . tdStat($row, "resp_server", "", "");
			$sRow .= "," . tdStat($row, "resp_transfer_encoding", "", "");
			$sRow .= "," . tdStat($row, "resp_vary", "", "");
			$sRow .= "," . tdStat($row, "resp_via", "", "");
			$sRow .= "," . tdStat($row, "resp_x_powered_by", "", "");

			$sRows .= $sRow . "\n";
		}
		mysql_free_result($result);
	}
	echo $sRows;
}

echo $sRows;


function tdStat($row, $field, $suffix = "", $class = "tdnum") {
	return ( array_key_exists($field, $row) ? $row[$field] : "" );
}
?>
