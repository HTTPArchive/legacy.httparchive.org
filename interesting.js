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

/*
DESCRIPTION: 
Return a JavaScript file that contains code for creating
rotating divs of interesting stats.
*/


function onloadCorrelation() {
	return findCorrelation("onLoad", "load");
}


function renderCorrelation() {
	return findCorrelation("renderStart", "render");
}


function findCorrelation($var1, $tname) {
	global $gPagesTable, $gRequestsTable, $ghColumnTitles;
	$sHtml = "<div class=itagline>highest correlation to <em>$tname</em> time:</div><table border=0 cellpadding=0 cellspacing=0>";
	$aVars = array("PageSpeed", "reqTotal", "reqHtml", "reqJS", "reqCSS", "reqImg", "reqFlash", "reqJson", "reqOther", "bytesTotal", "bytesHtml", "bytesJS", "bytesCSS", "bytesImg", "bytesFlash", "bytesJson", "bytesOther", "numDomains");
	// We only want to look at requests from the most recent run of each archive.
	$archivecond = "";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond .= ( $archivecond ? " or " : "" ) . "archive='$archive' and label='$label'";
	}
	$hCC = array();
	foreach ($aVars as $var2) {
		// from http://www.freeopenbook.com/mysqlcookbook/mysqlckbk-chp-13-sect-6.html
		$cmd = "SELECT @n := COUNT($var1) AS N, @sumX := SUM($var2) AS 'X sum', @sumXX := SUM($var2*$var2) 'X sum of squares', @sumY := SUM($var1) AS 'Y sum', @sumYY := SUM($var1*$var1) 'Y sum of square', @sumXY := SUM($var2*$var1) AS 'X*Y sum' FROM $gPagesTable where ($archivecond) and $var2 is not null and $var2 > 0;";
		doSimpleCommand($cmd);
		$query = "SELECT (@n*@sumXY - @sumX*@sumY) / SQRT((@n*@sumXX - @sumX*@sumX) * (@n*@sumYY - @sumY*@sumY)) AS correlation;";
		$cc = doSimpleQuery($query);

		// I want to sort the results by correlation coefficient ($cc),
		// so I use $cc as the hash key. But, $cc is not unique 
		// (it's possible for two variables to have the same $cc).
		// So the value for each hash entry is an array of variable name(s).
		if ( ! array_key_exists($cc, $hCC) ) {
			$hCC[$cc] = array();
		}
		array_push($hCC[$cc], $var2);
	}

	$aCC = array_keys($hCC);
	rsort($aCC, SORT_NUMERIC);
	$iRows = 0;
	foreach($aCC as $cc) {
		$prettyCC = round($cc*100)/100;
		foreach($hCC[$cc] as $var2) {
			$sHtml .= "<tr><td align=right>" . $ghColumnTitles[$var2] . ":</td> <td align=right>$prettyCC</td></tr>";
			$iRows++;
			if ( 5 <= $iRows ) {
				break;
			}
		}
		if ( 5 <= $iRows ) {
			break;
		}
	}
	return $sHtml . "</table>";
}


function redirects() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages containing redirects:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and status >= 300 and status < 400;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentJson() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages using JSON:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and resp_content_type like '%json%';");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function requestErrors() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages containing errors (4xx, 5xx):</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and status >= 400;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function imageFormats() {
	global $gPagesTable, $gRequestsTable;

	$hData = array();
	$totalrequests = 0;

	// We only want to look at requests from the most recent run of each archive.
	$archivecond = "";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond .= ( $archivecond ? " or " : "" ) . "archive='$archive' and label='$label'";
	}

	// TODO - Figure out a way to sort these based on numrequests - for now we know it's GIF, JPG, PNG.

	// GIF
	$query = "select count(*) as numrequests, sum(respSize) as totalbytes from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and resp_content_type like '%image/gif%';";
	$result = doQuery($query);
	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		if ( $row ) {
			$hData['GIF'] = array($row['numrequests'], $row['totalbytes']);
			$totalrequests += $row['numrequests'];
		}
		mysql_free_result($result);
	}

	// JPG
	$query = "select count(*) as numrequests, sum(respSize) as totalbytes from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and (resp_content_type like '%image/jpg%' or resp_content_type like '%image/jpeg%');";
	$result = doQuery($query);
	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		if ( $row ) {
			$hData['JPG'] = array($row['numrequests'], $row['totalbytes']);
			$totalrequests += $row['numrequests'];
		}
		mysql_free_result($result);
	}

	// PNG
	$query = "select count(*) as numrequests, sum(respSize) as totalbytes from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and resp_content_type like '%image/png%';";
	$result = doQuery($query);
	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		if ( $row ) {
			$hData['PNG'] = array($row['numrequests'], $row['totalbytes']);
			$totalrequests += $row['numrequests'];
		}
		mysql_free_result($result);
	}

	$sHtml = "<div class=itagline>most popular image formats:</div><table border=0 cellpadding=0 cellspacing=0><tr><th></th><th style='font-weight: normal; text-decoration: underline;'>% requests</th><th style='font-weight: normal; text-decoration: underline; padding-left: 16px;'><nobr>avg size</nobr></th></tr>";
	foreach(array_keys($hData) as $format) {
		$numrequests = $hData[$format][0];
		$totalbytes = $hData[$format][1];
		$sHtml .= "<tr><td style='padding-right: 16px;'>$format</td>" .
			"<td align=right>" . round(100*$numrequests/$totalrequests) . "%</td>" .
			"<td align=right>" . formatSize(round($totalbytes/$numrequests)) . "kB</td>" .
			"</tr>";
	}
	return $sHtml . "</table>";
}


function percentFlash() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages using Flash:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqFlash > 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function popularScripts() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>most popular scripts:</div><table border=0 cellpadding=0 cellspacing=0>";

	// We only want to look at requests from the most recent run of each archive.
	$archivecond = "";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond .= ( $archivecond ? " or " : "" ) . "archive='$archive' and label='$label'";
	}

	$result = doQuery("select $gRequestsTable.url, count(*) as num from $gRequestsTable, $gPagesTable where $gRequestsTable.pageid=$gPagesTable.pageid and ($archivecond) and resp_content_type like '%script%' group by $gRequestsTable.url order by num desc limit 5;");
	while ($row = mysql_fetch_assoc($result)) {
		$url = $row['url'];
		$sHtml .= "<tr><td>$url</td></tr>";
	}
	mysql_free_result($result);
	return $sHtml . "</table>";
}


function percentGA() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages using Google Analytics:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gRequestsTable.pageid) from $gPagesTable, $gRequestsTable where $archivecond and $gRequestsTable.pageid=$gPagesTable.pageid and ($gRequestsTable.url like '%/ga.js%' or $gRequestsTable.url like '%/urchin.js%');");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentJQuery() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages using jQuery:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable where $archivecond and $gRequestsTable.pageid=$gPagesTable.pageid and resp_content_type like '%script%' and $gRequestsTable.url like '%jquery%';");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentGoogleLibrariesAPI() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages using Google Libraries API:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(distinct $gPagesTable.pageid) from $gPagesTable, $gRequestsTable where $archivecond and $gRequestsTable.pageid=$gPagesTable.pageid and $gRequestsTable.url like '%googleapis.com%';");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentNoJS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages with no scripts:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqJS = 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentNoCSS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages with no stylesheets:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqCSS = 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function mostJS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages with the most JavaScript:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select url, bytesJS from $gPagesTable where $archivecond order by bytesJS desc limit 1;");
		if ( $result ) {
			$row = mysql_fetch_assoc($result);
			if ( $row ) {
				$sHtml .= "<tr><td align=right>$archive:</td> <td>" . siteLink($row['url']) . "</td> <td align=right>" . formatSize($row['bytesJS']) . "kB</td></tr>";
			}
			mysql_free_result($result);
		}
	}
	return $sHtml . "</table>";
}


function mostCSS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages with the most CSS:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select url, bytesCSS from $gPagesTable where $archivecond order by bytesCSS desc limit 1;");
		if ( $result ) {
			$row = mysql_fetch_assoc($result);
			if ( $row ) {
				$sHtml .= "<tr><td align=right>$archive:</td> <td>" . siteLink($row['url']) . "</td> <td align=right>" . formatSize($row['bytesCSS']) . "kB</td></tr>";
			}
			mysql_free_result($result);
		}
	}
	return $sHtml . "</table>";
}


function mostFlash() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>pages with the most Flash files:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select url, reqFlash from $gPagesTable where $archivecond order by reqFlash desc limit 1;");
		if ( $result ) {
			$row = mysql_fetch_assoc($result);
			if ( $row ) {
				$sHtml .= "<tr><td align=right>$archive:</td> <td>" . siteLink($row['url']) . "</td> <td align=right>" . $row['reqFlash'] . "</td></tr>";
			}
			mysql_free_result($result);
		}
	}
	return $sHtml . "</table>";
}

$gCacheFile = "interesting.js.cache";
$snippets = "";
if ( file_exists($gCacheFile) ) {
	$snippets = file_get_contents($gCacheFile);
}

if ( ! $snippets ) {
	$aSnippetFunctions = array(
							   "mostJS",
							   "mostCSS",
							   "mostFlash",
							   "percentFlash",
							   "imageFormats",
							   "popularScripts",
							   "percentGA",
							   "percentJQuery",
							   "percentGoogleLibrariesAPI",
							   "onloadCorrelation",
							   "renderCorrelation",
							   "requestErrors",
							   "percentNoJS",
							   "percentNoCSS",
							   "redirects"
							   );
	$snippets = "";
	foreach($aSnippetFunctions as $func) {
		$snippets .= 'gaSnippets.push("' . call_user_func($func) . '");' . "\n";
	}
	// This won't work for web site users because of permissions.
	// Run "php interesting.js" from the commandline to generate the cache file.
	// I'll leave this line generating errors as a reminder to create the cache file.
	file_put_contents("./interesting.js.cache", $snippets);
}
?>
// HTML strings for each snippet
var gaSnippets = new Array();
<?php echo $snippets ?>


// The DOM element that is created from each snippet.
var gaSnippetElems = new Array();
var curSnippet;

function showSnippet(parentId, bPrev) {
	var parent = document.getElementById(parentId);
	if ( ! parent ) {
		return;
	}

	insertNav(parentId);

	var iSnippet = Math.floor(gaSnippets.length * Math.random());
	if ( curSnippet ) {
		iSnippet = parseInt(curSnippet.id)
		fade(curSnippet, true);
	}

	iSnippet = ( bPrev ? iSnippet-1 : iSnippet+1 );
	if ( iSnippet >= gaSnippets.length ) {
		iSnippet = 0;
	}
	else if ( iSnippet < 0 ) {
		iSnippet = gaSnippets.length - 1;
	}

	var newSnippet = gaSnippetElems[iSnippet];
	if ( "undefined" === typeof(newSnippet) ) {
		newSnippet = document.createElement('div');
		newSnippet.id = iSnippet;
		gaSnippetElems[iSnippet] = newSnippet;
		newSnippet.className = "ianswer";
		newSnippet.innerHTML = gaSnippets[iSnippet];
		var aPosition = findPos(parent);
		newSnippet.style.left = aPosition[0] + "px";
		newSnippet.style.top = aPosition[1] + "px";
		parent.appendChild(newSnippet);
	}
	else {
		newSnippet.style.display = "block";
	}

	curSnippet = newSnippet;
	fade(newSnippet);
}


function insertNav(parentId) {
	if ( document.getElementById('interestingnav') ) {
		return;
	}

	var elem = document.getElementById(parentId);
	var nav = document.createElement('div');
	nav.id = "interestingnav";
	nav.innerHTML = 
		"<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\", 1)'><img src='images/arrow-left-16x16.gif' width=16 height=16 border=0></a>" +
		"<a href='interesting.php' style='margin: 0 8px; vertical-align: top;'>interesting stats</a>" +
		"<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\")'><img src='images/arrow-right-16x16.gif' width=16 height=16 border=0></a>";
	elem.parentNode.insertBefore(nav, elem);
}


// opacity is a number 0-100 inclusive
function fade(idOrElem, bOut) {
	var elem = idOrElem;
	if ( "string" === typeof(idOrElem) || "number" === typeof(idOrElem) ) {
		elem = document.getElementById(idOrElem);
	}
	if ( ! elem ) {
		return;
	}

	opacity = ( elem.style.opacity ? parseInt(elem.style.opacity * 100) : ( bOut ? 100 : 0 ) );
	opacity = ( bOut ? opacity - 10 : opacity + 10 );
	opacity = ( 100 < opacity ? 100 : ( 0 > opacity ? 0 : opacity ) );

	elem.style.opacity = opacity/100;
	elem.style.filter = "alpha(opacity = " + opacity + ")";

	if ( (bOut && 0 < opacity ) || ( !bOut && 100 > opacity) ) {
		setTimeout(function() { fade(elem, bOut); }, 50);
	}
	else if ( bOut ) {
		elem.style.display = "none";
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


function dprint(msg) {
	if ( "undefined" != typeof(console) ) {
		console.log(msg);
	}
}
