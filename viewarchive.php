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
$gTitle = $gArchive . " stats";
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

<div style="width: 800px; margin-top: 10px;">
<?php
if ( $gArchive ) {
	echo <<<OUTPUT
<div style='float: right; font-size: 0.8em; text-align: right;'>
<a href='urls.php?a=$gArchive'>list of URLs</a>
<br>
<a href='download.php?a=$gArchive&l=$gLabel&format=csv'>download CSV</a>
</div>
OUTPUT;
}
?>
<table cellpadding=0 cellspacing=0>
<tr>
<td>
choose an archive:
</td>
<td style="padding-left: 4px;">
<select onChange="document.location='viewarchive.php?a='+escape(this.options[this.selectedIndex].value)">
  <option>
<?php
$aNames = archiveNames();
for ( $i = 0; $i < count($aNames); $i++ ) {
	$name = $aNames[$i];
	echo "  <option value='$name'" . ( $name == $gArchive ? " selected" : "" ) . ">$name\n";
}
?>
</select>
</td>
</tr>
<?php
if ( $gArchive ) {
	echo "<tr>\n<td align=right style='padding-top: 4px;'>choose a run:</td>\n<td align=right style='padding-top: 4px; padding-left: 4px;'>" . selectArchiveLabel($gArchive, $gLabel) . "</td></tr>\n";
}
?>
</table>
</div>



<style>
#stats { font-size: 0.8em; font-family: Arial; margin-top: 20px; }
#stats TD { border-left: 1px solid #CCC; padding: 4px; }
#stats TH { border-left: 1px solid #CCC; padding: 4px; }
.odd { background: #F0F0F0; }
.avg { background: #FDE0B5; }
.iwps { border: 1px solid #CCC; width: 23px; height: 16px; }
#avg TD { border-top: 2px solid #000; border-bottom: 2px solid #000; }
</style>

<?php
if ( $gArchive ) {
	echo <<<OUTPUT
<table id=stats class=sortable border=0 cellpadding=0 cellspacing=0 style="border: 1px solid #CCC; border-left: 0;">
	<tr>
<th>Website</th> 
<th style='border-left: 0;'>&nbsp;</th> 
<th class="sorttable_numeric">load<br>time</th> 
<th class="sorttable_numeric">start<br>render</th> 
<th class="sorttable_numeric">Page<br>Speed<br>score</th> 
<th class="sorttable_numeric">total<br>reqs</th> 
<th class="sorttable_numeric">total<br>xfer<br>size</th> 
<th class="sorttable_numeric">html<br>reqs</th> 
<th class="sorttable_numeric">html<br>xfer<br>size</th> 
<th class="sorttable_numeric">JS<br>reqs</th> 
<th class="sorttable_numeric">JS<br>xfer<br>size</th> 
<th class="sorttable_numeric">CSS<br>reqs</th> 
<th class="sorttable_numeric">CSS<br>xfer<br>size</th> 
<th class="sorttable_numeric">image<br>reqs</th> 
<th class="sorttable_numeric">image<br>xfer<br>size</th> 
<th class="sorttable_numeric">num<br>domains</th> 
</tr>

OUTPUT;

	$sRows = "";
	$iRow = 0;
	//$sRows = file_get_contents("cache/$gArchive.pages");
	if ( ! $sRows ) {
		// overall averages for the entire archive
		$query = "select ROUND(AVG(onLoad)) as onLoad, ROUND(AVG(renderStart)) as renderStart, ROUND(AVG(PageSpeed)) as PageSpeed, ROUND(AVG(reqTotal)) as reqTotal, ROUND(AVG(reqHtml)) as reqHtml, ROUND(AVG(reqJS)) as reqJS, ROUND(AVG(reqCSS)) as reqCSS, ROUND(AVG(reqImg)) as reqImg, ROUND(AVG(bytesTotal)) as bytesTotal, ROUND(AVG(bytesHtml)) as bytesHtml, ROUND(AVG(bytesJS)) as bytesJS, ROUND(AVG(bytesCSS)) as bytesCSS, ROUND(AVG(bytesImg)) as bytesImg, ROUND(AVG(numDomains)) as numDomains from $gPagesTable where archive = '$gArchive' and label = '$gLabel';";
		$result = doQuery($query);
		$row = mysql_fetch_assoc($result);
		$sRow = "<tr id=avg class=avg>";
		$sRow .= "<td style='border-left: 2px solid #000;'>average overall</td> ";
		$sRow .= "<td style='border-left: 0;'>&nbsp;</td>";
		$sRow .= tdStat($row, "onLoad", "ms");
		$sRow .= tdStat($row, "renderStart", "ms");
		$sRow .= tdStat($row, "PageSpeed");
		$sRow .= tdStat($row, "reqTotal");
		$sRow .= tdStat($row, "bytesTotal", "kB");
		$sRow .= tdStat($row, "reqHtml");
		$sRow .= tdStat($row, "bytesHtml", "kB");
		$sRow .= tdStat($row, "reqJS");
		$sRow .= tdStat($row, "bytesJS", "kB");
		$sRow .= tdStat($row, "reqCSS");
		$sRow .= tdStat($row, "bytesCSS", "kB");
		$sRow .= tdStat($row, "reqImg");
		$sRow .= tdStat($row, "bytesImg", "kB");
		$sRow .= str_replace("<td", "<td style='border-right: 2px solid #000;'", tdStat($row, "numDomains")); // hack
		$sRow .= "</tr>\n";
		$sRows .= $sRow;
		mysql_free_result($result);
	
		$query = "select pageid, url, urlShort, onLoad, renderStart, PageSpeed, reqTotal, reqHtml, reqJS, reqCSS, reqImg, bytesTotal, bytesHtml, bytesJS, bytesCSS, bytesImg, numDomains from $gPagesTable where archive = '$gArchive' and label = '$gLabel' order by urlShort asc;";
		$result = doQuery($query);
		if ( $result ) {
			while ($row = mysql_fetch_assoc($result)) {
				$iRow++;
				$sRow = "<tr" . ( $iRow % 2 == 0 ? " class=odd" : "" ) . ">";
				$sRow .= "<td><a href='viewsite.php?pageid=" . $row['pageid'] . "&a=$gArchive'>" . shortenUrl($row['url']) . "</a></td> ";
				$sRow .= "<td style='border-left: 0;'><a href='viewsite.php?pageid=" . $row['pageid'] . "&a=$gArchive'><img class=iwps src='images/waterfall-23x16.png' title='Waterfall &amp; Page Speed'></a></td>";
				$sRow .= tdStat($row, "onLoad", "ms");
				$sRow .= tdStat($row, "renderStart", "ms");
				$sRow .= tdStat($row, "PageSpeed");
				$sRow .= tdStat($row, "reqTotal");
				$sRow .= tdStat($row, "bytesTotal", "kB");
				$sRow .= tdStat($row, "reqHtml");
				$sRow .= tdStat($row, "bytesHtml", "kB");
				$sRow .= tdStat($row, "reqJS");
				$sRow .= tdStat($row, "bytesJS", "kB");
				$sRow .= tdStat($row, "reqCSS");
				$sRow .= tdStat($row, "bytesCSS", "kB");
				$sRow .= tdStat($row, "reqImg");
				$sRow .= tdStat($row, "bytesImg", "kB");
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
script.src = "sorttable-async.js";
script.text = "sorttable.init()";  // this is optional - without it, "sorttable.init()" is called during onload
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
