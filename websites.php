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

$gArchive = "All";
$gLabel = ( array_key_exists("l", $_GET) ? $_GET["l"] : latestLabel($gArchive) );
$gTitle = "Web Sites";
$gMaxUrls = 20000;
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title>HTTP Archive - <?php echo $gTitle ?></title>
	<meta charset="UTF-8">

<style>
.websites { 
	list-style-type: none; }
</style>
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<ul class=websites>
<?php
$query = "select pageid, url from $gPagesTable where archive = '$gArchive' group by url order by urlShort asc limit $gMaxUrls;";
$result = doQuery($query);
while ($row = mysql_fetch_assoc($result)) {
	echo "<li> <a href='viewsite.php?pageid=" . $row['pageid'] . "&a=$gArchive&l=$gLabel'>" . shortenUrl($row['url']) . "</a>\n";
}
mysql_free_result($result);
?>
</ul>

<?php echo uiFooter() ?>

</body>
</html>
