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

require_once("ui.inc");
require_once("utils.inc");
require_once("dbapi.inc");
require_once("urls.inc");
require_once("pages.inc");

$gTitle = "View Site";
$pageData = null;
if ( getParam('pageid') ) {
	$gPageid = getParam('pageid');
	$pageData = pageData($gPageid);
}
else if ( ! isset($gPageid) && getParam('u') && getParam('l') ) {
	$url = getParam('u');
	$gLabel = getParam('l');
	$pageData = pageData(null, $url, $gLabel);
}
else if ( getParam('rand') ) {
	$crawl = latestCrawl();
	$gPageid = randomPageid($crawl);
	$pageData = pageData($gPageid);
}
else {
	// should never reach here
	header('Location: websites.php');
	return;
}

// TODO - better error handling starting here!
// Changed to select * to allow summary paragraph
if ( ! $pageData ) {
	header('Location: websites.php');
	return;
}

// Flush any currently open buffers.
while (ob_get_level() > 0) {
	ob_end_flush();
}
ob_start();

$gPageid = $pageData['pageid'];
$gLabel = $pageData['label'];
$url = $pageData['url'];
$wptid = $pageData['wptid'];
$wptrun = $pageData['wptrun'];
$onLoad = $pageData['onLoad'];
$renderStart = $pageData['renderStart'];

$wptServer = wptServer();
$harfileWptUrl = wptHarFileUrl($wptid, $wptrun, 0);
?>
<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title><?php echo genTitle(htmlentities($url)) ?></title>

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
<link rel="stylesheet" href="harviewer/css/harViewer.css" type="text/css">
</head>

<body class=viewsite id=top>
<?php echo uiHeader($gTitle); ?>

	<h1><?php echo str_replace('>http://', '><span class=protocol>http://</span>', siteLink($url)) ?></h1>
	
	<p class=summary style="margin-bottom: 4px;">took <?php echo round(($onLoad / 1000), 1) ?> seconds to load <?php echo round(($pageData['bytesTotal']/1024)) ?>kB of data over <?php echo $pageData['reqTotal'] ?> requests.</p>
<div><a href="<?php echo rankUrl($url) ?>">Alexa rank: <?php echo commaize( rank($url, $gPageid) ) ?></a></div>
<div>
<?php 
echo diffRuns($url, $gLabel);
?>
</div>

	<ul class=quicklinks>
		<li><a href="#top">Top of page</a></li>
		<li><a href="#filmstrip">Filmstrip</a></li>
		<li><a href="#sitestats">Stats</a></li>
		<li><a href="#trends">Trends</a></li>
		<li><a href="#waterfall">Waterfall</a></li>
		<li><a href="#pagespeed">Page Speed</a></li>
		<li><a href="#requests">Requests</a></li>
		<li><a href="#downloads">Downloads</a></li>
	</ul>
	
	<?php echo selectSiteLabel($url, $gLabel); ?>


<h2 id=filmstrip>Filmstrip, Video</h2>

<?php 
// Build a table that has empty cells to be filled in later.
if ( ! onBlacklist($url) ) {

	if ( $gbMobile ) {
		// right now Blaze.io only does 1 FPS
		$intervalOptions = <<<OUTPUT
<option value=1000>1 second</option>
OUTPUT;
	}
	else {
		$intervalOptions = <<<OUTPUT
<option value=100>0.1 seconds</option>
<option value=500>0.5 seconds</option>
<option value=1000>1 second</option>
<option value=5000>5 seconds</option>
OUTPUT;
	}

	$sBorder = ( $gbMobile ? "2px solid #E0E0E0" : "0px" );
	echo <<<OUTPUT
<section id="videoContainer">
<div id="videoDiv">
</div>
</section>


<script>
function showInterval(ms) {
	var table = document.getElementById('video');
	var aThs = table.getElementsByTagName('th');
	var aTds = table.getElementsByTagName('td');
	var len = aTds.length;
	var prevSrc;
	for ( var i = 0; i < len; i++ ) {
		var t = aTds[i].id.substring(2);
		var sDisplay = "none";
		var sBorder = "$sBorder";
		var img = aTds[i].getElementsByTagName('img')[0];
		if ( 0 === ( t % ms ) || i === len-1 ) {
			sDisplay = "table-cell";
			if ( !img.src && img.id ) {
				img.src = img.id;
			}
			if ( prevSrc != img.src ) {
				prevSrc = img.src;
				if ( 0 < t ) {
					sBorder = "3px solid #FEB301";
				}
			}
		}
		aTds[i].style.display = sDisplay;
		aThs[i].style.display = sDisplay;
		img.style.border = sBorder;
	}

	var sel = document.getElementById('interval');
	for ( var i = 0; i < sel.options.length; i++ ) {
		var option = sel.options[i];
		if ( option.value == ms ) {
			option.selected = true;
			break;
		}
	}
}
</script>

<form>
<label for=interval>Show screenshots every:</label>
<select id=interval onchange='showInterval(this.options[this.selectedIndex].value)'>
$intervalOptions
</select>
</form>

<script type="text/javascript">
// Load this async since it does an RPC for the filmstrip XML.
var filmstripjs = document.createElement('script');
filmstripjs.src = "filmstrip.js?pageid=$gPageid";
document.getElementsByTagName('head')[0].appendChild(filmstripjs);
</script>

OUTPUT;
}
?>

<ul class=horizlist>
  <li> <a href="<?php echo $wptServer ?>video/compare.php?tests=<?php echo $wptid ?>-r:<?php echo $wptrun ?>-c:0">WPT filmstrip</a>
  <li> <a href="<?php echo $wptServer ?>video/create.php?tests=<?php echo $wptid ?>-r:<?php echo $wptrun ?>-c:0&id=<?php echo $wptid ?>.<?php echo $wptrun ?>.0">watch video</a>
</ul>


<h2 id=sitestats>Stats</h2>

<?php
$gSlice = "url";
$gUrl = $url;

require_once("stats.inc");
require_once("charts.inc");

$hStats = getStats($gLabel, $gSlice, ($gbMobile ? "iphone" : "IE8"), $url);
echo bytesContentTypeChart($hStats);
echo responseSizes($hStats);
echo popularImageFormats($hStats);
echo maxage($hStats);
echo percentByProtocol($hStats);
?>

<h2 id=trends>Trends</h2>

<?php
// trends.inc is REALLY SLOW so we flush the buffer first.
ob_flush();
if ( getParam("flush", 1) ) { //CVSNO - remove this after blog post is old
	flush();
}
require_once('trends.inc');
?>


<h2 id=waterfall>HTTP Waterfall</h2>

<div id="content">
</div>


<script src='schema.js'></script>
<script src='harviewer.js?wptid=<?php echo $wptid ?>&wptrun=<?php echo $wptrun ?>&cached=0'></script>

<script>
$("#content").bind("onPreviewInit", 
				   function(event) {
					   var viewer = event.target.repObject;
					   viewer.appendPreview(HARjson);
				   }
				   );
</script>
<script data-main="harviewer/scripts/harPreview" src="harviewer/scripts/require.js"></script>
<style>
.pageInfoCol {
	background: #fff;
}
</style>


<h2 id=pagespeed>Page Speed</h2>

<?php
if ( ! $gbMobile ) {
	// NOT mobile
	echo <<<OUTPUT
<style>
#pagespeedreport UL { max-width: 100%; }
</style>
<div id="pagespeedreport" style="margin-top: 10px; font-size: 0.9em;"></div>

<script type="text/javascript" src="{$wptServer}widgets/pagespeed/tree?test=$wptid&div=pagespeedreport"></script>
OUTPUT;
}
else {
	// mobile
	$file = BuildFileName($url);
	$fullpath = "./harfiles-delme/$gPageid.$file.har";
	$bWritten = false;
	if( strlen($file) ) {
		$response = file_get_contents($harfileWptUrl);
		if( strlen($response) ) {
			file_put_contents("$fullpath", $response);
			$bWritten = true;
		}
	}
	if ( $bWritten ) {
		doFile($fullpath);
		unlink($fullpath);
	}

	echo <<<OUTPUT
<script>
var curDetails;

function toggleDetails(elem) {
	if ( "undefined" != typeof(curDetails) ) {
		curDetails.style.display = "none";
	}

	var div = elem.parentNode.getElementsByTagName('DIV')[0];
	if ( "undefined" != typeof(div) ) {
		var aPosition = findPos(elem.parentNode);
		div.style.left = (aPosition[0] + elem.parentNode.clientWidth) + 25 + "px";
		div.style.top = aPosition[1] + "px";
		div.style.display = "block";
		curDetails = div;
	}
}


// from http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
}
</script>

OUTPUT;
}






/**
* Create a file name given an url
* 
* @param mixed $results
*/
function BuildFileName($url) {
    $file = trim($url, "\r\n\t \\/");
    $file = str_ireplace('http://', '', $file);
    $file = str_ireplace(':', '_', $file);
    $file = str_ireplace('/', '_', $file);
    $file = str_ireplace('\\', '_', $file);
    $file = str_ireplace('%', '_', $file);
    
    return $file;
}


function doFile($harfile) {
	if ( ! $harfile ) {
		return;
	}

	// If everything is ok we run it through Page Speed.
	$output = array();
	$return_var = 128;
	exec("./har_to_pagespeed text '$harfile'", $output, $return_var);
	if ( 0 === $return_var ) {
		$len = count($output);
		$rules = array();
		$curRule = -1;
		for ( $i = 0; $i < $len; $i++ ) {
			$line = $output[$i];
			$matches = array();
			if ( preg_match("/_(.*)_ \(score=([0-9]+)/", $line, $matches) ) {                            // don't need to worry about 0 vs false
				if ( "Optimize images" != $matches[1] ) {
					$curRule++;
					array_push($rules, array($matches[1], $matches[2], ""));
				}
			}
			else {
				if ( -1 < $curRule ) {
					$line = fixUrls($line);
					$rules[$curRule][2] .= $line . "<br>";
				}
			}
		}
		displayRules($rules);
	}
	else { 
		echo "There was an error parsing the HAR file. $return_var";
	}

}

function displayRules($rules) {
	$ruleStrings = array();  // a hash whose keys are the rule scores
	$totalScore = 0;

	for ( $r = 0; $r < count($rules); $r++ ) {
		$rule = $rules[$r];
		$score = $rule[1];
		$totalScore += $score;

		$ruleString = displayRule($rule);
		if ( ! array_key_exists($score, $ruleStrings) ) {
			$ruleStrings[$score] = "";
		}
		$ruleStrings[$score] .= $ruleString;
	}

	$overallScore = intval(0.5 + ($totalScore/count($rules)));
	echo "<table class=pagespeed>\n" .
		"  <tr><th style='padding-top: 40px; border-bottom: 2px solid; padding-bottom: 8px;'><span style='font-size: 1.2em; padding: 0 2px 0 2px; font-weight: bold; border: 2px solid; color: " . 
		scoreColor($overallScore) .
		"'>$overallScore</span></td>" .
		"<th style='padding-top: 40px; border-bottom: 2px solid; font-weight: bold; font-size: 1.5em;'>Page Speed score</td></tr>\n";

	$scores = array_keys($ruleStrings);
	sort($scores);
	for ( $i = 0; $i < count($scores); $i++ ) {
		$score = $scores[$i];
		echo $ruleStrings[$score];
	}
	echo "</table>\n";
}


function displayRule($rule) {
	$title = $rule[0];
	$score = $rule[1];
	$details = $rule[2];

	$detailsHtml = "";
	if ( $details ) {
		$detailsHtml = "<a href='show details' alt='show details' onclick='toggleDetails(this); return false;' style='text-decoration: none;'><img src='images/right-arrow-17x14.gif' width=17 height=14></a>" .
			"<div class=popup style='display: none;'>$details</div>\n";
	}

	$html = "<tr><td class=score style='color: " . scoreColor($score) . ";'>$score</td><td>$title $detailsHtml</td></tr>\n";

	return $html;
}


function scoreColor($score) {
	return ( $score >= 80 ? "#008000" : ( $score >= 60 ? "#808000" : "#9F0000" ) );
}

function fixUrls($line) {
	$pos = ( strpos($line, "http://") ? strpos($line, "http://") : strpos($line, "https://") );
	if ( $pos ) {
		$pos2 = ( strpos($line, " ", $pos+1) ? strpos($line, " ", $pos+1) : strlen($line) );
		$url = substr($line, $pos, $pos2-$pos);
		return substr($line, 0, $pos) . "<a href='$url'>" . substr($url, 0, 40) . ( strlen($url) > 40 ? "..." : "" ) . "</a>" . substr($line, $pos2);
	}

	return $line;
}

?>



<h2 id=requests>Requests</h2>
<a href="download.php?p=<?php echo $gPageid ?>&format=csv">download CSV</a>
<div class="customCol"><input type="button" class="customColToggleButton" onclick="toggleCustomColDiag();" value="+" /> customize columns</div>
<?php 
// An array with all the columns, whether they're sortable, and the initial visibility state
$columns = array(array('name'=>'Req#', 'sortable'=>true),
				 array('name'=>'URL'),
				 array('name'=>'Mime type', 'dbName'=>'mimeType', 'class'=>'nobr'),
				 array('name'=>'Method', 'dbName'=>'method', 'hidden'=>true),
				 array('name'=>'Status', 'dbName'=>'status', 'sortable'=>true),
				 array('name'=>'Time', 'dbName'=>'time', 'suffix'=>'ms', 'sortable'=>true, 'hidden'=>true),
				 array('name'=>'Response Size', 'dbName'=>'respSize','suffix'=>'kB', 'sortable'=>true),
				 array('name'=>'Request Cookie Len', 'dbName'=>'reqCookieLen','prefix'=>'b', 'sortable'=>true, 'hidden'=>true),
				 array('name'=>'Response Cookie Len', 'dbName'=>'respCookieLen','prefix'=>'b', 'sortable'=>true, 'hidden'=>true),
				 array('name'=>'Request Http&nbsp;Ver', 'dbName'=>'reqHttpVersion', 'hidden'=>true),
				 array('name'=>'Response Http&nbsp;Ver', 'dbName'=>'respHttpVersion', 'hidden'=>true),
				 array('name'=>'Request Accept', 'dbName'=>'req_accept','suffix'=>'snip', 'class'=>'nobr', 'hidden'=>true),
				 array('name'=>'Request Accept-Charset', 'dbName'=>'req_accept_charset', 'hidden'=>true),
				 array('name'=>'Request Accept-Encoding', 'dbName'=>'req_accept_encoding', 'class'=>'nobr', 'hidden'=>true),
				 array('name'=>'Requst Accept-Language', 'dbName'=>'req_accept_language', 'hidden'=>true),
				 array('name'=>'Request Connect', 'dbName'=>'req_connection', 'hidden'=>true),
				 array('name'=>'Request Host', 'dbName'=>'req_host', 'hidden'=>true),
				 array('name'=>'Request Referer', 'dbName'=>'req_referer','suffix'=>'url', 'hidden'=>true),
				 array('name'=>'Response Accept-Ranges', 'dbName'=>'resp_accept_ranges', 'hidden'=>true),
				 array('name'=>'Response Age', 'dbName'=>'resp_age', 'hidden'=>true),
				 array('name'=>'Response Cache-Control', 'dbName'=>'resp_cache_control'),
				 array('name'=>'Response Connection', 'dbName'=>'resp_connection', 'hidden'=>true),
				 array('name'=>'Response Content-Encoding', 'dbName'=>'resp_content_encoding'),
				 array('name'=>'Response Content-Language', 'dbName'=>'resp_content_language', 'hidden'=>true),
				 array('name'=>'Response Content-Length', 'dbName'=>'resp_content_length', 'hidden'=>true),
				 array('name'=>'Response Content-Location', 'dbName'=>'resp_content_location', 'hidden'=>true),
				 array('name'=>'Response Content-Type', 'dbName'=>'resp_content_type', 'hidden'=>true),
				 array('name'=>'Response Date', 'dbName'=>'resp_date', 'class'=>'nobr', 'hidden'=>true),
				 array('name'=>'Response ETag', 'dbName'=>'resp_etag'),
				 array('name'=>'Response Expires', 'dbName'=>'resp_expires', 'class'=>'nobr', 'hidden'=>true),
				 array('name'=>'Response Keep-Alive', 'dbName'=>'resp_keep_alive', 'hidden'=>true),
				 array('name'=>'Response Last-Modified', 'dbName'=>'resp_last_modified'),
				 array('name'=>'Response Location', 'dbName'=>'resp_location','suffix'=>'url', 'hidden'=>true),
				 array('name'=>'Response Pragma', 'dbName'=>'resp_pragma', 'hidden'=>true),
				 array('name'=>'Response Server', 'dbName'=>'resp_server', 'hidden'=>true),
				 array('name'=>'Response Transfer-Encoding', 'dbName'=>'resp_transfer_encoding', 'hidden'=>true),
				 array('name'=>'Response Vary', 'dbName'=>'resp_vary', 'hidden'=>true),
				 array('name'=>'Response Via', 'dbName'=>'resp_via', 'hidden'=>true),
				 array('name'=>'X-Powered-By', 'dbName'=>'resp_x_powered_by', 'hidden'=>true)
				 );
?>

<div id='requestCustomCols' style='display: none;' >
<form autocomplete='off'>
<table id='CustomColTable'>

<?php
// Generate the custom column selection form
$len = count($columns);
for ( $i = 0; $i < $len; $i++ ) {
	//split the custom col table into five columns
	if ( 0 == ($i % 5) ) {
		echo "<tr>\n";
	}
	$column = $columns[$i];
	$name = $column['name'];
	$checked = ( array_key_exists('hidden', $column) ? "" : " checked='checked'" );
	echo "  <td><input type='checkbox'$checked onclick='toggleColByName(\"$name\")'></td><td>$name</td>\n";
	if ( 4 == ($i % 5) ) {
		echo "</tr>\n";
	}
}
?>

</table></form></div>

<table id='stats' class='tablesort' border=0 cellpadding=0 cellspacing=0>
<?php
// Print the table headers
echo "<tr>\n";
for ( $i = 0; $i < $len; $i++ ) {
	$column = $columns[$i];
	$sTh = "<th" .
		( array_key_exists('sortable', $column) ? " class='sortnum'" : "" ) .
		( array_key_exists('hidden', $column) ? " style='display:none;'" : "" ) .
		">" . $column['name'] . "</th>\n";
	echo $sTh;
}
echo "</tr>\n";


// MySQL Table
$sRows = "";
$iRow = 0;
$gFirstStart = 0;
$page = pageFromWPT($wptid, $wptrun);
$aResources = $page['resources'];
foreach($aResources as $resource) {
	if ( !$gFirstStart ) {
		$gFirstStart = intval($resource['startedDateTime']);
	}
	$iRow++;
	$sRow = "<tr" . ( $iRow % 2 == 0 ? " class=odd" : "" ) . ">";
	$sRow .= "<td class='tdnum '>$iRow</td> ";
	$sRow .= "<td class='nobr ' style='font-size: 0.9em;'><a href='" . $resource['url'] . "'>" . shortenUrl($resource['url']) . "</a></td> ";
	for ( $i = 0; $i < $len; $i++ ) {
		$column = $columns[$i];
		if ( ('Req#' != $column['name']) && ('URL' != $column['name'])){
			$class = ( array_key_exists('class', $column) ? $column['class'] : "tdnum" );
			$suffix = ( array_key_exists('suffix', $column) ? $column['suffix'] : "" );
			$hidden = ( array_key_exists('hidden', $column) ? $column['hidden'] : "" );
			$sRow .= tdStat($resource, $column['dbName'], $suffix, $class, $hidden);
		}
	}
	$sRows .= $sRow;
}
echo $sRows;

?>
</table>

<script type="text/javascript">
var tsjs = document.createElement('script');
tsjs.src = "tablesort.js";
tsjs.onload = function() { TS.init(); };
tsjs.onreadystatechange = function() { if ( tsjs.readyState == 'complete' || tsjs.readyState == 'loaded' ) { TS.init(); } };
document.getElementsByTagName('head')[0].appendChild(tsjs);


function toggleColByName(colName) {
    var i = 0;
    var colId = 0;
    var shown = false;
    jQuery('#stats > thead > tr:nth-child(1) > th').each( 
														 function() {
															 if (colName == jQuery(this).text()) {
																 colId = i + 1;
																 shown = jQuery(this).is(":visible");
															 }
															 i++;
														 } );
    if ( 0 != colId ) {
		if ( shown ) {
			jQuery('#stats > tbody > tr > td:nth-child(' + colId + '),#stats > thead > tr > th:nth-child(' + colId + ')').hide(); 
		} 
		else {
			jQuery('#stats > tbody > tr > td:nth-child(' + colId + '),#stats > thead > tr > th:nth-child(' + colId + ')').show(); 
		}
    }
}


function toggleCustomColDiag() {
    var toggleButton = jQuery('input.customColToggleButton');
    if ( '+' == toggleButton.val() ) {
		toggleButton.val('-'); 
		jQuery('#requestCustomCols').show();
    } 
	else {
		toggleButton.val('+'); 
		jQuery('#requestCustomCols').hide();
    }
}
</script>



<h2 id=downloads>Downloads</h2>

<div style='margin-top: 4px; font-size: 0.8em;'>
<a href='<?php echo $harfileWptUrl ?>'>download HAR file</a>
</div>


<?php echo uiFooter() ?>

</body>

</html>

<?php
function tdStat($resource, $field, $suffix = "", $class = "tdnum", $bHidden = false) {
	global $gFirstStart;

	$value = ( array_key_exists($field, $resource) ? $resource[$field] : "" );
	$snipmax = 12;

	if ( "kB" === $suffix ) {
		if ( 0 == $value || ! $value ) {
			$value = "&nbsp;";
			$suffix = "";
		}
		else {
			$value = formatSize($value);
			if ( 0 == $value ) {
				$value = 1;  // don't round down to zero
			}
		}
	}
	else if ( "b" === $suffix ) {
		if ( 0 == $value || ! $value ) {
			$value = "&nbsp;";
			$suffix = "";
		}
	}
	else if ( "snip" === $suffix ) {
		$suffix = "";
		if ( strlen($value) > ($snipmax+5) ) {
			$value = "<a href='javascript:' title='$value'>" . substr($value, 0, $snipmax) . "</a>";
		}
	}
	else if ( "url" === $suffix ) {
		$suffix = "";
		$url = $value;
		$iLastSlash = strrpos($url, "/");
		$sFilename = substr($url, $iLastSlash, $snipmax);
		$value = "<a href='$url'>$sFilename</a>";
	}
	else if ( "start" == $suffix ) {
		$suffix = "";
		$value = intval($value) - $gFirstStart;
	}

	if ( $class ) {
		$class = " class=$class";
	}

	$hidden = ( $bHidden ? " style='display: none;'" : "" );

	return ( $suffix ? "<td$class$hidden>$value&nbsp;$suffix</td>" : "<td$class$hidden>$value</td>" );
}
?>
