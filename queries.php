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
most popular image format
most popular script & stylesheet
who's doing JSON?
404s, 301s
*/

$ghQueries = array();
$ghQueries["What percentage of sites use Flash?"] = "percentFlash";
$ghQueries["What percentage of sites have no script files?"] = "percentNoJS";
$ghQueries["What percentage of sites have no stylesheets?"] = "percentNoCSS";
$ghQueries["Which sites have the most JavaScript?"] = "mostJS";
$ghQueries["Which sites have the most CSS?"] = "mostCSS";
$ghQueries["Which sites have the most Flash files?"] = "mostFlash";
$ghQueries["What percentage of sites use ga.js or urchin.js?"] = "percentGA";

// return HTML for a list of interesting queries
function interestingQueries($bAll = false) {
	global $ghQueries;

	$sHtml = <<<OUTPUT
<script>
var gCurAnswer;
var gLeft = 400;

function showAnswer(question) {
	var answer = question.parentNode.parentNode.getElementsByTagName('div')[0];
	answer.style.opacity = 0;
	answer.style.display = "block";
	var aPosition = findPos(question);
	gLeft = ( gLeft > aPosition[0] ? gLeft : aPosition[0] );
	answer.style.left = (gLeft + parseInt(50 * Math.random())) + "px";
	answer.style.top = aPosition[1] + "px";

	if ( gCurAnswer ) {
		fade(gCurAnswer, true);
	}
	fade(answer);
	gCurAnswer = answer;
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

<style>
.iquestion { font-weight: bold; }
.iquestion A { text-decoration: none; }
.ianswer { font-size: 0.9em; display: none; margin-left: 20px; position: fixed; border: 1px solid #CCC; background: #FFFFB9; padding: 6px; border-radius: 8px; -webkit-border-radius: 8px; -moz-border-radius: 8px; }
.ianswer TD { padding: 0 4px 0 4px; }
.itagline { font-weight: bold; }
</style>
OUTPUT;

	if ( $bAll ) {
		foreach(array_keys($ghQueries) as $q) {
			$sHtml .= "<div style='margin-top: 4px;'><span class=iquestion><a href='#' alt='show answer' onclick='showAnswer(this); return false;'>$q</a></span>\n" . call_user_func($ghQueries[$q]) . "</div>\n";
		}
	}

	return $sHtml;
}


function percentFlash() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites using Flash:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqFlash > 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>\n";
	}
	return $sHtml . "</table></div>\n";
}


function percentGA() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites using Google Analytics:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select $gRequestsTable.pageid from $gPagesTable, $gRequestsTable where $archivecond and $gRequestsTable.pageid=$gPagesTable.pageid and ($gRequestsTable.url like '%/ga.js%' or $gRequestsTable.url like '%/urchin.js%') group by pageid;");
		$num = 0;
		while ($row = mysql_fetch_assoc($result)) {
			$num++;
		}
		mysql_free_result($result);
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>\n";
	}
	return $sHtml . "</table></div>\n";
}


function percentNoJS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites with no scripts:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqJS = 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>\n";
	}
	return $sHtml . "</table></div>\n";
}


function percentNoCSS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites with no stylesheets:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqCSS = 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>\n";
	}
	return $sHtml . "</table></div>\n";
}


function mostJS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites with the most JavaScript:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select url, bytesJS from $gPagesTable where $archivecond order by bytesJS desc limit 1;");
		if ( $result ) {
			$row = mysql_fetch_assoc($result);
			if ( $row ) {
				$sHtml .= "<tr><td align=right>$archive:</td> <td>" . siteLink($row['url']) . "</td> <td align=right>" . formatSize($row['bytesJS']) . "kB</td></tr>\n";
			}
			mysql_free_result($result);
		}
	}
	return $sHtml . "</table></div>\n";
}


function mostCSS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites with the most CSS:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select url, bytesCSS from $gPagesTable where $archivecond order by bytesCSS desc limit 1;");
		if ( $result ) {
			$row = mysql_fetch_assoc($result);
			if ( $row ) {
				$sHtml .= "<tr><td align=right>$archive:</td> <td>" . siteLink($row['url']) . "</td> <td align=right>" . formatSize($row['bytesCSS']) . "kB</td></tr>\n";
			}
			mysql_free_result($result);
		}
	}
	return $sHtml . "</table></div>\n";
}


function mostFlash() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=ianswer><div class=itagline>sites with the most Flash:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$result = doQuery("select url, reqFlash from $gPagesTable where $archivecond order by reqFlash desc limit 1;");
		if ( $result ) {
			$row = mysql_fetch_assoc($result);
			if ( $row ) {
				$sHtml .= "<tr><td align=right>$archive:</td> <td>" . siteLink($row['url']) . "</td> <td align=right>" . $row['reqFlash'] . "</td></tr>\n";
			}
			mysql_free_result($result);
		}
	}
	return $sHtml . "</table></div>\n";
}

?>
