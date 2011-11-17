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

ini_set('display_errors','1');
require_once("utils.inc");
require_once("ui.inc");
require_once("urls.inc");

$gTitle = "Admin";
?>
<!doctype html>
<html>
<head>
<title><?php genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<div style="margin-top: 40px;">
<?php
$gAction = getParam('a');
if ( "create" === $gAction ) {
	echo "<p>Creating MySQL tables...</p>\n";
	createTables();
	echo "<p>DONE</p>\n";
} 
else if ( "approveUrl" == $gAction) {
	approveUrl(getParam('u'));
	echo "<p class=warning> URL '".getParam('u')."' was approved!";
} 
else if ( "rejectUrl" == $gAction) {
	rejectUrl(getParam('u'));
	echo "<p class=warning> URL '".getParam('u')."' was rejected!";
}
?>
</div>

<a href="admin.php?a=create">create MySQL tables</a>
<h2>URL Add Requests</h2>
 
<?php
$result = pendingUrls();
if ( $result != -1) {
	echo "<table>\n<tr> <td>URL</td> <td>Date Requested</td> <td>Similar URLs</td> <td>Action</td> </tr>\n";
	while($row = mysql_fetch_assoc($result)){
		$url = $row['url'];
		$sld = secondLevelDomain($url);
		$query = "select urlOrig, urlFixed, rank, other from $gUrlsTable where urlOrig like '%.$sld%' or urlOrig like '%/$sld%' or urlFixed like '%.$sld%' or urlFixed like '%/$sld%' order by rank asc;";
		$result2 = doQuery($query);
		$sSimilar = "";
		$iSimilar = 0;
		$nShow = 3;
		while ($row2 = mysql_fetch_assoc($result2)) {
			$iSimilar++;
			if ( $iSimilar <= $nShow ) {
				$url2 = ( $row2['urlFixed'] ? $row2['urlFixed'] : $row2['urlOrig'] );
				$rank = ( $row2['rank'] ? commaize($row2['rank']) : ( $row2['other'] ? "other" : "n/a" ) );
				$sSimilar .= ( $sSimilar ? "<br>" : "" ) . "$url2 ($rank)";
			}
		}
		mysql_free_result($result2);
		if ( $iSimilar > $nShow ) {
			$sSimilar .= "<br>" . ($iSimilar - $nShow) . " more...";
		}

		echo "<tr> <td><a href='$url'>$url</td> <td>" . date("h:ia m/d/Y",$row['createDate']) . "</td>" . 
			" <td>$sSimilar</td>" . 
			" <td><a href=\"admin.php?a=approveUrl&u=" . urlencode($url) . "\">Approve</a> | <a href=\"admin.php?a=rejectUrl&u=" . 
			urlencode($url) . "\">Reject</a></td> </tr>\n";
	}
	echo "</table>";
	mysql_free_result($result);
} 
else {
	print "An Error Occured! URLs could not be loaded.";
}
?>


<?php echo uiFooter() ?>

</body>
</html>
