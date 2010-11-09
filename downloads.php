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

require_once("ui.php");
require_once("utils.php");

$gTitle = "Downloads";

/*
Here's how httparchive_mysqldump.gz was generated:
  mysqldump -u miscadmin -p<insert password or get prompted> -h mysql.stevesouders.com stevesouderscom_misc pages<dev> requests<dev> > httparchive_mysqldump
  gzip httparchive_mysqldump

Here's how I did a CSV of Fortune 100 requestsdev:
select pagesdev.urlShort, requestsdev.urlShort, method, redirectUrl, firstReq, firstHtml, reqHttpVersion, reqHeadersSize, reqBodySize, reqCookieLen, status, respHttpVersion, respHeadersSize, respBodySize, respSize, respCookieLen, mimeType, req_accept, req_accept_charset, req_accept_encoding, req_accept_language, req_connection, req_host, req_if_modified_since, req_if_none_match, req_referer, req_user_agent, resp_accept_ranges, resp_age, resp_cache_control, resp_connection, resp_content_encoding, resp_content_language, resp_content_length, resp_content_location, resp_content_type, resp_date, resp_etag, resp_expires, resp_keep_alive, resp_last_modified, resp_location, resp_pragma, resp_server, resp_transfer_encoding, resp_vary, resp_via, resp_x_powered_by into outfile 'fortune1000.csv' fields terminated by ',' optionally enclosed by '"' lines terminated by '\n' from pagesdev, requestsdev where pagesdev.pageid=requestsdev.pageid and archive="Fortune 1000" and label="Oct 2010";

mysqldump -u miscadmin -p -h mysql.stevesouders.com --fields-terminated-by ',' --fields-optionally-enclosed-by '"' --lines-terminated-by '\n' select pagesdev.urlShort, requestsdev.urlShort, method, redirectUrl, firstReq, firstHtml, reqHttpVersion, reqHeadersSize, reqBodySize, reqCookieLen, status, respHttpVersion, respHeadersSize, respBodySize, respSize, respCookieLen, mimeType, req_accept, req_accept_charset, req_accept_encoding, req_accept_language, req_connection, req_host, req_if_modified_since, req_if_none_match, req_referer, req_user_agent, resp_accept_ranges, resp_age, resp_cache_control, resp_connection, resp_content_encoding, resp_content_language, resp_content_length, resp_content_location, resp_content_type, resp_date, resp_etag, resp_expires, resp_keep_alive, resp_last_modified, resp_location, resp_pragma, resp_server, resp_transfer_encoding, resp_vary, resp_via, resp_x_powered_by from pagesdev, requestsdev where pagesdev.pageid=requestsdev.pageid and archive="Fortune 1000" and label="Oct 2010" stevesouderscom_misc pagesdev requestsdev;

*/
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title><?php echo $gTitle ?></title>
	<meta charset="UTF-8">
</head>

<body>

<?php echo uiHeader($gTitle); ?>
<h1>Downloads</h1>
<p>
All <a href="viewarchive.php">Archive tables</a> and the tables for each site have a "download CSV" link next to them.
</p>

<p>
In addition, you can download the entire are has a <a href="httparchive_mysqldump.gz">compressed mysqldump</a>.
</p>

<?php echo uiFooter() ?>

</body>

</html>

