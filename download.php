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

require_once("utils.php");
require_once("ui.php");

$gArchive = ( array_key_exists('a', $_GET) ? $_GET['a'] : "" );
$gLabel = ( array_key_exists('l', $_GET) ? $_GET['l'] : "" );
$gPageid = ( array_key_exists('p', $_GET) ? $_GET['p'] : "" );
$gFormat = $_GET['format'];


if ( $gPageid && "csv" == $gFormat ) {
	header('Content-Type: application/octet-stream; name="httparchive.csv"'); 
	header('Content-Disposition: inline; filename="httparchive_page' . $gPageid . '.csv"');

	$sRows = "";

	$sRows .= "URL,mime_type,method,status,time(ms),resp_Size(kB),req_Cookie_Len(bytes),resp_Cookie_Len(bytes),req_Http_Ver,resp_Http_Ver,req_Accept,req_Accept-Charset,req_Accept-Encoding,req_Accept-Language,req_Connection,req_Host,req_Referer,resp_Accept-Ranges,resp_Age,resp_Cache-Control,resp_Connection,resp_Content-Encoding,resp_Content-Language,resp_Content-Length,resp_Content-Location,resp_Content-Type,resp_Date,resp_Etag,resp_Expires,resp_Keep-Alive,resp_Last-Modified,resp_Location,resp_Pragma,resp_Server,resp_Transfer-Encoding,resp_Vary,resp_Via,resp_X-Powered-By\n";

	$query = "select * from $gRequestsTable where pageid = $gPageid;";
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
else if ( $gArchive && $gLabel && "csv" == $gFormat ) {
	header('Content-Type: application/octetstream; name="httparchive.csv"'); 
	header('Content-Disposition: inline; filename="' . str_replace(" ", "_", "$gArchive $gLabel.csv") . '"');

	$sRows = "";
	$iRow = 0;
	$sRows .= "Website,load time(ms),Page Speed score,total reqs,total size(kB),html reqs,html size(kB),JS reqs,JS size(kB),CSS reqs,CSS size(kB),image reqs,image size(kB),num domains\n";

	// overall averages for the entire archive
	$query = "select ROUND(AVG(onLoad)) as onLoad, ROUND(AVG(PageSpeed)) as PageSpeed, ROUND(AVG(reqTotal)) as reqTotal, ROUND(AVG(reqHtml)) as reqHtml, ROUND(AVG(reqJS)) as reqJS, ROUND(AVG(reqCSS)) as reqCSS, ROUND(AVG(reqImg)) as reqImg, ROUND(AVG(bytesTotal)) as bytesTotal, ROUND(AVG(bytesHtml)) as bytesHtml, ROUND(AVG(bytesJS)) as bytesJS, ROUND(AVG(bytesCSS)) as bytesCSS, ROUND(AVG(bytesImg)) as bytesImg, ROUND(AVG(numDomains)) as numDomains from $gPagesTable where archive = '$gArchive' and label = '$gLabel' order by urlShort asc;";
	$result = doQuery($query);
	$row = mysql_fetch_assoc($result);
	$sRow = "average overall";
	$sRow .= "," . tdStat($row, "onLoad", "ms");
	$sRow .= "," . tdStat($row, "PageSpeed");
	$sRow .= "," . tdStat($row, "reqTotal");
	$sRow .= "," . tdStat($row, "bytesTotal", "kB");
	$sRow .= "," . tdStat($row, "reqHtml");
	$sRow .= "," . tdStat($row, "bytesHtml", "kB");
	$sRow .= "," . tdStat($row, "reqJS");
	$sRow .= "," . tdStat($row, "bytesJS", "kB");
	$sRow .= "," . tdStat($row, "reqCSS");
	$sRow .= "," . tdStat($row, "bytesCSS", "kB");
	$sRow .= "," . tdStat($row, "reqImg");
	$sRow .= "," . tdStat($row, "bytesImg", "kB");
	$sRows .= $sRow . "\n";
	mysql_free_result($result);

	$query = "select pageid, url, urlShort, onLoad, PageSpeed, reqTotal, reqHtml, reqJS, reqCSS, reqImg, bytesTotal, bytesHtml, bytesJS, bytesCSS, bytesImg, numDomains from $gPagesTable where archive = '$gArchive' and label = '$gLabel' order by urlShort asc;";
	$result = doQuery($query);
	if ( $result ) {
		while ($row = mysql_fetch_assoc($result)) {
			$iRow++;
			$sRow = $row['urlShort'];
			$sRow .= "," . tdStat($row, "onLoad", "ms");
			$sRow .= "," . tdStat($row, "PageSpeed");
			$sRow .= "," . tdStat($row, "reqTotal");
			$sRow .= "," . tdStat($row, "bytesTotal", "kB");
			$sRow .= "," . tdStat($row, "reqHtml");
			$sRow .= "," . tdStat($row, "bytesHtml", "kB");
			$sRow .= "," . tdStat($row, "reqJS");
			$sRow .= "," . tdStat($row, "bytesJS", "kB");
			$sRow .= "," . tdStat($row, "reqCSS");
			$sRow .= "," . tdStat($row, "bytesCSS", "kB");
			$sRow .= "," . tdStat($row, "reqImg");
			$sRow .= "," . tdStat($row, "bytesImg", "kB");
			$sRow .= "," . tdStat($row, "numDomains");
			$sRows .= $sRow . "\n";
		}
		mysql_free_result($result);
	}
}
echo $sRows;


function tdStat($row, $field, $suffix = "", $class = "tdnum") {
	$value = $row[$field];
	if ( "kB" === $suffix ) {
		$value = formatSize($value);
	}

	return ( $suffix ? "$value" : "$value" );
}

function formatSize($num) {
	return round($num / 1000);
}
?>
