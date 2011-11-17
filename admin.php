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

$iUrl = 1;
while(true) {
	$action = getParam("a$iUrl");
	$url = urldecode(getParam("u$iUrl"));

	if ( $action && $url ) {
		if ( "approve" === $action ) {
			approveUrl($url);
			echo "<p class=warning> URL \"$url\" was approved!</p>";
		} 
		else if ( "reject" === $action) {
			rejectUrl($url);
			echo "<p class=warning> URL \"$url\" was rejected!</p>";
		}
		$iUrl++;
		continue;
	}

	break;
}
?>
</div>

<a href="admin.php?a=create">create MySQL tables</a>
<h2>URL Add Requests</h2>
 
<?php
$result = pendingUrls();
if ( $result != -1) {
	echo "<form name=urlsform><table>\n<tr><td align=right colspan=5><input type=submit value='Submit'></td></tr>\n<tr> <td>URL</td> <td>Date Requested</td> <td>Similar URLs</td> <td>Approve</td> <td>Reject</td> </tr>\n";
	$iUrl = 0;
	while($row = mysql_fetch_assoc($result) && $iUrl < 5){
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

		$iUrl++;
		echo "<tr> <td><a href='$url'>$url</td> <td>" . date("h:ia m/d/Y",$row['createDate']) . "</td>" . 
			" <td>$sSimilar</td> <input type=hidden name=u$iUrl value='" . urlencode($url) . "'>" .
			" <td><input type=radio name=a$iUrl value='approve' style='vertical-align: top;' checked></td> " .
			" <td><input type=radio name=a$iUrl value='reject' style='vertical-align: top;'></td> " .
			"</tr>\n";
	}
	echo "<tr><td align=right colspan=5><input type=submit value='Submit'></td></tr>\n</table></form>\n";
	mysql_free_result($result);
} 
else {
	print "An Error Occured! URLs could not be loaded.";
}
?>


<?php echo uiFooter() ?>

</body>
</html>
