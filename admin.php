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
$gbSimilar = getParam('sim', 0);
$gAction = getParam('a');

if ( "create" === $gAction ) {
	echo "<p>Creating MySQL tables...</p>\n";
	createTables();
	echo "<p>DONE</p>\n";
} 

$giUrl = 1;
while(true) {
	$action = getParam("a$giUrl");
	$url = urldecode(getParam("u$giUrl"));

	if ( $action && $url ) {
		if ( "add" === $action ) {
			approveAddUrl($url);
			echo "<p class=warning> URL \"$url\" was added.</p>";
		} 
		else if ( "remove" === $action ) {
			approveRemoveUrl($url);
			echo "<p class=warning> URL \"$url\" was removed.</p>";
		} 
		else if ( "other" === $action ) {
			addOtherUrl($url);
			// we don't need to remove it from the urlschange table because it's not in that table
			echo "<p class=warning> URL \"$url\" set as \"other\".</p>";
		} 
		else if ( "reject" === $action) {
			rejectUrl($url);
			echo "<p class=warning> URL \"$url\" was rejected.</p>";
		}
		$giUrl++;
		continue;
	}

	break;
}
?>
</div>

<a href="admin.php?a=create">create MySQL tables</a>





<h2>URL Add/Remove Requests</h2>
 
<?php
function addUrlToForm($url, $action, $createDate, $bSimilar=true) {
	global $giUrl, $gUrlsTable;

	$sRow = "";

	// Find similar URLs.
	$sSimilar = "";
	if ( $bSimilar ) {
		$sld = secondLevelDomain($url);
		$iSimilar = 0;
		$nSim = 3;
		$query = "select urlOrig, urlFixed, rank, other from $gUrlsTable where urlOrig like '%.$sld%' or urlOrig like '%/$sld%' or urlFixed like '%.$sld%' or urlFixed like '%/$sld%' order by rank asc limit $nSim;";
		$result = doQuery($query);
		while ($row = mysql_fetch_assoc($result)) {
			$iSimilar++;
			if ( $iSimilar <= $nSim ) {
				$urlsim = ( $row['urlFixed'] ? $row['urlFixed'] : $row['urlOrig'] );
				if ( $url === $urlsim ) {
					if ( $row['other'] ) {
						// The URL supplied by the user is ALREADY in the urls table and is ALREADY other=true. There's nothing more we can do. BAIL!
						rejectUrl($url);  // remove it from the urlschange table
						return "";
					}
					else if ( "add" === $action ) {
						// The URL is already in the urls table, so instead of "add" ask if we want to set other=true
						$action = "other";
					}
				}
				$rank = ( $row['rank'] ? commaize($row['rank']) : "not ranked" );
				$other = ( $row['other'] ? "other" : "!other" );
				$sSimilar .= ( $sSimilar ? "<br>" : "" ) . "$urlsim ($rank, $other)";
				if ( 1 === $iSimilar && "add" == $action && $url != $urlsim && !$row['other'] ) {
					// In many cases people request "http://example.com" but "http://www.example.com" is already in the list.
					// In this case we want to set other=true for http://www.example.com, so we add that as a new row.
					// The admin can REJECT http://example.com/, and approve http://www.example.com/.
					$sRow .= addUrlToForm($urlsim, "other", time(), false);
				}
			}
		}
		mysql_free_result($result);
		if ( $iSimilar > $nSim ) {
			$sSimilar .= "<br>" . ($iSimilar - $nSim) . " more...";
		}
	}

    $sRow = "<tr> <td><a href='$url'>$url</td> <td>" . date("h:ia m/d/Y",$createDate) . "</td>" . 
	" <td>$sSimilar</td> <input type=hidden name=u$giUrl value='" . urlencode($url) . "'>" .
	" <td><nobr><input type=radio name=a$giUrl value='$action' style='vertical-align: top;' checked> $action</nobr></td> " .
	" <td><nobr><input type=radio name=a$giUrl value='" . ( "other" === $action ? "ignore" : "reject" ) . "' style='vertical-align: top;'> " .
	( "other" === $action ? "ignore" : "reject" ) . "</nobr></td> " .
	"</tr>\n" .
	$sRow;  // in case there's a similar row
	$giUrl++;

	return $sRow;
}

$result = pendingUrls();
if ( $result != -1 ) {
	echo "<form name=urlsform><table>\n<tr><td colspan=4>\n" .
		( $gbSimilar ? "" : "<a href='admin.php?sim=1'>I have time - find similar URLs</a>" ) .
		"</td> <td><input type=submit value='Submit'></td></tr>\n<tr> <td>URL</td> <td>Date Requested</td> <td>Similar URLs</td> <td>Action</td> <td>Reject</td> </tr>\n";
	$i = 0;
	$giUrl = 1;
	$maxUrls = 8;
	while ( $row = mysql_fetch_assoc($result) ){
		$i++;
		if ( $i > $maxUrls ) {
			// we'll just count the number of URLs via $i
			continue;
		}

		echo addUrlToForm($row['url'], $row['action'], $row['createDate'], $gbSimilar);
	}
	mysql_free_result($result);

	echo "<tr><td align=right colspan=5><input type=submit value='Submit'></td></tr>\n</table>" .
		"<input type=hidden name=sim value='$gbSimilar'></form>\n";
	$moreUrls = $i - $maxUrls;
	if ( $moreUrls > 0 ) {
		echo "<p>$moreUrls more pending URLs...</p>\n";
	}
} 
else {
	print "An Error Occured! URLs could not be loaded.";
}
?>



<?php echo uiFooter() ?>

</body>
</html>
