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

$gTitle = "HTTP Archive";
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title><?php echo $gTitle ?></title>
	<meta charset="UTF-8">
	
<style>
.column {
	float: left;
	width: 50%; }
h2 {
	clear: both; }
/*#interestingnav, #interesting { position: absolute; left: 50%; }
#interesting { margin-top: -2.8em; }*/
#interestingnav { margin-top: 39px; }
#interesting table {
	border-bottom: none; }
#interesting tr {
	background: none; }
#interesting tr td {
	background: none; }
.iquestion { font-weight: bold; }
.iquestion A { text-decoration: none; }
.ianswer { font-size: 0.9em; border: 1px solid #CCC; background: #FFFFB9; padding: 6px; border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; opacity: 0; filter: alpha(opacity = 0); }
#interestingnav { margin-left: 20px; font-size: 0.9em; font-weight: bold; }
.ianswer TD { padding: 0 4px 0 4px; }
.itagline { font-weight: bold; margin-bottom: 4px; }
</style>
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<p class="summary">The <a href="http://httparchive.org">HTTP Archive</a> tracks how the Web is built.</p>

<ul class="even-columns">
  <li>Trends in web technology&mdash;use of JavaScript, CSS, and new image formats
  <li>Performance of the Web&mdash;page speed, size, and errors
  <li>Open&mdash;the <a href="http://code.google.com/p/httparchive/source/checkout">code</a> is open source, the data is <a href="downloads.php">downloadable</a>
</ul>

<section class="column">
<h2>Choose an archive:</h2>
	<ul>
	<?php
	$aNames = archiveNames();
	for ( $i = 0; $i < count($aNames); $i++ ) {
		$name = $aNames[$i];
		echo "  <li> <a href='viewarchive.php?a=" . urlencode($name) . "'>$name</a>\n";
	}
	?>
	</ul>
</section>

<section class="column">
	<div id=interesting>
	<!-- interesting.js will insert interesting stats here -->
	</div>
</section>

<h2>Archive Averages</h2>

<table id=stats class=tablesort>
	<tr>
<th>Archive</th> 
<?php
	// column headers
	//$aColumns = array("onLoad", "renderStart", "PageSpeed", "reqTotal", "bytesTotal", "reqHtml", "bytesHtml", "reqJS", "bytesJS", "reqCSS", "bytesCSS", "reqImg", "bytesImg", "numDomains");
	$aColumns = array("onLoad", "renderStart", "PageSpeed", "reqTotal", "bytesTotal", "numDomains");
	foreach($aColumns as $column) {
		echo "<th class='sortnum'>" . $ghColumnTitles[$column] . "</th> ";
	}
?>
</tr>

<?php
$sRows = "";
$iRow = 0;
$aArchives = archiveNames();
for ( $i = 0; $i < count($aArchives); $i++ ) {
	$iRow++;
	$archive = $aArchives[$i];
	$label = latestLabel($archive);
	$query = "select ROUND(AVG(onLoad)) as onLoad, ROUND(AVG(renderStart)) as renderStart, ROUND(AVG(PageSpeed)) as PageSpeed, ROUND(AVG(reqTotal)) as reqTotal, ROUND(AVG(reqHtml)) as reqHtml, ROUND(AVG(reqJS)) as reqJS, ROUND(AVG(reqCSS)) as reqCSS, ROUND(AVG(reqImg)) as reqImg, ROUND(AVG(bytesTotal)) as bytesTotal, ROUND(AVG(bytesHtml)) as bytesHtml, ROUND(AVG(bytesJS)) as bytesJS, ROUND(AVG(bytesCSS)) as bytesCSS, ROUND(AVG(bytesImg)) as bytesImg, ROUND(AVG(numDomains)) as numDomains from $gPagesTable where archive = '$archive' and label = '$label';";
	$result = doQuery($query);
	$row = mysql_fetch_assoc($result);
	$sRow = "<tr" . ( $iRow % 2 == 0 ? "" : " class=odd" ) . ">";
	$sRow .= "<td><a href='viewarchive.php?a=$archive'>$archive</a></td> ";
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
}
echo $sRows;

function tdStat($row, $field, $suffix = "", $class = "tdnum") {
	$value = $row[$field];
	if ( "kB" === $suffix ) {
		$value = formatSize($value);
	}

	return ( $suffix ? "<td class=$class>$value&nbsp;$suffix</td>" : "<td class=$class>$value</td>" );
}
?>
</table>

<script type="text/javascript">
var script = document.createElement('script');
script.src = "tablesort.js";
script.onload = function() { TS.init(); };
document.getElementsByTagName('head')[0].appendChild(script);

var script2 = document.createElement('script');
script2.src = "interesting.js";
script2.onload = function() { showSnippet('interesting'); };
document.getElementsByTagName('head')[0].appendChild(script2);
</script>

<?php echo uiFooter() ?>

</body>
</html>
