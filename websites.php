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
$gChar = ( array_key_exists("c", $_GET) ? $_GET["c"] : "A" );
$gLcChar = strtolower($gChar);
$gTitle = "Web Sites";
$gMaxUrls = 20000;
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title>HTTP Archive - <?php echo $gTitle ?></title>
	<meta charset="UTF-8">

</head>

<body>
<?php echo uiHeader($gTitle); ?>

<style>
.websites { 
	list-style-type: none; }
#alphaindex { 
	text-align: center;
	position: fixed; 
	left: 0; }
#alphaindex > UL { 
	list-style-type: none; }
#alphaindex a {
	font-weight: bold;
	color: #004D92;
	padding: 0 20px 0 10px; }
#alphaindex a:focus, #alphaindex a:hover {
	color: #004D92;
    border-bottom: 0; }
#alphaindex li {
	border: 1px solid #FFF;
	margin-bottom: 0; }
#alphaindex li:focus, #alphaindex li:hover {
	border: 1px solid #3C7DC8; }
#alphaindex .selected {
	background: #3C7DC8; }
#alphaindex .selected A {
	color: #FFF; }
#alphaindex LI.selected {
	border: 1px solid #3C7DC8; }
</style>


<p style="font-weight: bold;">
<?php
$query = "select count(distinct(url)) from $gPagesTable where archive = '$gArchive';";
$count = doSimpleQuery($query);
echo "$count total URLs";
?>
</p>


<div id=alphaindex>
<ul>
  <li<?php echo ( $gChar === "0" ? " class=selected" : "" ) ?>> <a href='?c=0'>0-9</a>
<?php
for ( $i = 65; $i <= 90; $i++ ) {
	$char = chr($i);
	echo "<li" . ( $gChar === $char ? " class=selected" : "" ) . "> <a href='?c=$char'>$char</a>\n";
}
?>
</ul>
</div>

<a name='top'></a>
<ul class=websites>
<?php
$query = "select max(pageid) as pageid, url from $gPagesTable where archive = '$gArchive' and (" .
	( "w" === $gLcChar ? "(url like 'http://w%' and url not like 'http://www.%')" : "url like 'http://$gLcChar%'" ) .
	" or url like 'http://www.$gLcChar%') group by url order by url asc limit $gMaxUrls;";
if ( "0" === $gChar ) {
	$query = "select max(pageid) as pageid, url from $gPagesTable where archive = '$gArchive' and url like 'http://www.%' and url not regexp 'http://www.[a-z]' and url not regexp 'http://www.[A-Z]' group by url order by url asc limit $gMaxUrls;";
}
$result = doQuery($query);
$lastMark = "";
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ereg('http://www\.([a-z])', $url, $regs) ) {
		$curMark = $regs[1];
		if ( $curMark != $lastMark ) {
			echo "<a name='" . strtoupper($curMark) . "'></a>\n";
			$lastMark = $curMark;
		}
	}
	echo "<li> <a href='viewsite.php?pageid=" . $row['pageid'] . "'>" . shortenUrl($url) . "</a>\n";
}
mysql_free_result($result);
?>
</ul>

<?php echo uiFooter() ?>

</body>
</html>
