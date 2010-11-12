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

$gArchive = ( array_key_exists("a", $_GET) ? $_GET["a"] : "" );
$gLabel = ( array_key_exists("l", $_GET) ? $_GET["l"] : latestLabel($gArchive) );
$gTitle = $gArchive;
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

<section class="even-columns">
<form>
	<label>Choose an archive:</label>
	<select onChange="document.location='viewarchive.php?a='+escape(this.options[this.selectedIndex].value)">
	<option> <?php //leave this so the first time the user goes to the page without a selection nothing is selected ?>
<?php
$aNames = archiveNames();
for ( $i = 0; $i < count($aNames); $i++ ) {
	$name = $aNames[$i];
	echo "  <option value='$name'" . ( $name == $gArchive ? " selected" : "" ) . ">$name</option>\n";
}
?>
	</select>
</form>

<?php
if ( $gArchive ) { ?>
<form>
	<label>Chose a run:</label>

	<?php echo selectArchiveLabel($gArchive, $gLabel); ?>
</form>
<?php } ?>


<?php
if ( $gArchive ) {
	echo <<<OUTPUT
	<p><a href='urls.php?a=$gArchive'>list of URLs</a><br><a href='download.php?a=$gArchive&l=$gLabel&format=csv'>download CSV</a></p>
OUTPUT;
}
?>
</section>

<?php
if ( $gArchive ) {
	echo "<table id=stats class=tablesort>\n" .
		"<tr><th colspan=2>Website</th>";

	// column headers
	//$aColumns = array("onLoad", "renderStart", "PageSpeed", "reqTotal", "bytesTotal", "reqHtml", "bytesHtml", "reqJS", "bytesJS", "reqCSS", "bytesCSS", "reqImg", "bytesImg", "numDomains");
	$aColumns = array("onLoad", "renderStart", "PageSpeed", "reqTotal", "bytesTotal", "numDomains");
	foreach($aColumns as $column) {
		echo "<th class='sortnum'>" . $ghColumnTitles[$column] . "</th> ";
	}
	echo "</tr>\n";

	$sRows = "";
	$iRow = 0;
	//$sRows = file_get_contents("cache/$gArchive.pages");
	if ( ! $sRows ) {
		// overall averages for the entire archive
		$query = "select ROUND(AVG(onLoad)) as onLoad, ROUND(AVG(renderStart)) as renderStart, ROUND(AVG(PageSpeed)) as PageSpeed, ROUND(AVG(reqTotal)) as reqTotal, ROUND(AVG(reqHtml)) as reqHtml, ROUND(AVG(reqJS)) as reqJS, ROUND(AVG(reqCSS)) as reqCSS, ROUND(AVG(reqImg)) as reqImg, ROUND(AVG(bytesTotal)) as bytesTotal, ROUND(AVG(bytesHtml)) as bytesHtml, ROUND(AVG(bytesJS)) as bytesJS, ROUND(AVG(bytesCSS)) as bytesCSS, ROUND(AVG(bytesImg)) as bytesImg, ROUND(AVG(numDomains)) as numDomains from $gPagesTable where archive = '$gArchive' and label = '$gLabel';";
		$result = doQuery($query);
		$row = mysql_fetch_assoc($result);
		$sRow = "<tr id=avg>";
		$sRow .= "<td>average overall</td> ";
		$sRow .= "<td style='border-left: 0;'>&nbsp;</td>"; // leave this - it's a placeholder for the chart image column
		$sRow .= tdStat($row, "onLoad", "ms");
		$sRow .= tdStat($row, "renderStart", "ms");
		$sRow .= tdStat($row, "PageSpeed");
		$sRow .= tdStat($row, "reqTotal");
		$sRow .= tdStat($row, "bytesTotal", "kB");
		//$sRow .= tdStat($row, "reqHtml");
		//$sRow .= tdStat($row, "bytesHtml", "kB");
		//$sRow .= tdStat($row, "reqJS");
		//$sRow .= tdStat($row, "bytesJS", "kB");
		//$sRow .= tdStat($row, "reqCSS");
		//$sRow .= tdStat($row, "bytesCSS", "kB");
		//$sRow .= tdStat($row, "reqImg");
		//$sRow .= tdStat($row, "bytesImg", "kB");
		$sRow .= tdStat($row, "numDomains");
		$sRow .= "</tr>\n";
		$sRows .= $sRow;
		mysql_free_result($result);
	
		$query = "select pageid, url, urlShort, onLoad, renderStart, PageSpeed, reqTotal, reqHtml, reqJS, reqCSS, reqImg, bytesTotal, bytesHtml, bytesJS, bytesCSS, bytesImg, numDomains from $gPagesTable where archive = '$gArchive' and label = '$gLabel' order by urlShort asc;";
		$result = doQuery($query);
		if ( $result ) {
			while ($row = mysql_fetch_assoc($result)) {
				$iRow++;
				$sRow = "<tr" . ( $iRow % 2 == 0 ? " class=odd" : "" ) . ">";
				$sRow .= "<td><a href='viewsite.php?pageid=" . $row['pageid'] . "&a=$gArchive'>" . shortenUrl($row['url']) . "</a></td><td><a class='image-link' href='viewsite.php?pageid=" . $row['pageid'] . "&a=$gArchive'><img src='images/waterfall-23x16.png' title='Waterfall &amp; Page Speed'></a></td>";
				$sRow .= tdStat($row, "onLoad", "ms");
				$sRow .= tdStat($row, "renderStart", "ms");
				$sRow .= tdStat($row, "PageSpeed");
				$sRow .= tdStat($row, "reqTotal");
				$sRow .= tdStat($row, "bytesTotal", "kB");
				//$sRow .= tdStat($row, "reqHtml");
				//$sRow .= tdStat($row, "bytesHtml", "kB");
				//$sRow .= tdStat($row, "reqJS");
				//$sRow .= tdStat($row, "bytesJS", "kB");
				//$sRow .= tdStat($row, "reqCSS");
				//$sRow .= tdStat($row, "bytesCSS", "kB");
				//$sRow .= tdStat($row, "reqImg");
				//$sRow .= tdStat($row, "bytesImg", "kB");
				$sRow .= tdStat($row, "numDomains");
				$sRow .= "</tr>\n";
				$sRows .= $sRow;
				//if ( $iRow == 20 ) break;
			}
			mysql_free_result($result);
		}
		//file_put_contents("cache/$gArchive.pages", $sRows);
	}
	echo $sRows;
}
?>
</table>

<script type="text/javascript">
var script = document.createElement('script');
script.src = "tablesort.js";
script.onload = function() { TS.init(); };
document.getElementsByTagName('head')[0].appendChild(script);
</script>

<?php echo uiFooter() ?>

</body>
</html>

<?php
function tdStat($row, $field, $suffix = "", $class = "tdnum") {
	$value = $row[$field];
	if ( "kB" === $suffix ) {
		$value = formatSize($value);
	}

	return ( $suffix ? "<td class=$class>$value&nbsp;$suffix</td>" : "<td class=$class>$value</td>" );
}
?>
