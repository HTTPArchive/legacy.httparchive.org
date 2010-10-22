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
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<div style="width: 800px;"> <!-- contents -->
<p>
The <a href="http://httparchive.org">HTTP Archive</a> provides information about website performance such as
# of HTTP requests, use of gzip, and amount of JavaScript.
This information is recorded over time revealing trends in how the Internet is performing.
Built using Open Source software, the code and data are available to everyone allowing
researchers large and small to work from a common base.
The websites that are analyzed come from popular lists including the 
<a href="http://money.cnn.com/magazines/fortune/fortune500/2010/full_list/">Fortune 500</a>
and 
<a href="http://www.alexa.com/topsites">Alexa Top 500</a>.
<a style="margin-left: 4px; font-size: 0.8em;" href="about.php">read more</a>
</p>

<p>
<strong>Choose an archive:</strong>
<select onchange="document.location='viewarchive.php?a='+escape(this.options[this.selectedIndex].value)">
  <option>
<?php
$aNames = archiveNames();
for ( $i = 0; $i < count($aNames); $i++ ) {
	$name = $aNames[$i];
	echo "  <option value='$name'" . ( $name == $gArchive ? " selected" : "" ) . ">$name\n";
}
?>
</select>
</p>

</div> <!-- contents -->

<div style="margin-top: 30px;">
<span style="font-weight: bold; font-size: 1.2em;">Archive Averages</span>
</div>

<style>
#stats { font-size: 0.8em; font-family: Arial; margin-top: 8px; }
#stats TD { border-left: 1px solid #CCC; padding: 4px; }
#stats TH { border-left: 1px solid #CCC; padding: 4px; }
.odd { background: #F0F0F0; }
.iwps { border: 1px solid #CCC; width: 23px; height: 16px; }
</style>

<table id=stats class=sortable border=0 cellpadding=0 cellspacing=0 style="border: 1px solid #CCC; border-left: 0;">
	<tr>
<th>Archive</th> 
<th class="sorttable_numeric">load<br>time</th> 
<th class="sorttable_numeric">start<br>render</th> 
<th class="sorttable_numeric">Page<br>Speed<br>Score</th> 
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
	$sRow .= "<td><a href='viewarchive.php?a=$archive'><nobr>$archive</nobr></a></td> ";
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
script.src = "sorttable-async.js";
script.text = "sorttable.init()";  // this is optional - without it, "sorttable.init()" is called during onload
document.getElementsByTagName('head')[0].appendChild(script);
</script>

<?php echo uiFooter() ?>

</body>
</html>
