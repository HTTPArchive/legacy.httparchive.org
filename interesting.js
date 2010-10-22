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


/*
most popular image format
most popular script & stylesheet
who's doing JSON?
404s, 301s
correlation of time to X
*/

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

	$sHtml = "<div class=itagline>most popular image formats:</div><table border=0 cellpadding=0 cellspacing=0><tr><th>&nbsp;</th><th>% requests</th><th style='padding-left: 16px;'># requests</th><th style='padding-left: 16px;'><nobr>avg size</nobr></th></tr>";
	foreach(array_keys($hData) as $format) {
		$numrequests = $hData[$format][0];
		$totalbytes = $hData[$format][1];
		$sHtml .= "<tr><td style='padding-right: 16px;'>$format</td>" .
			"<td align=right>" . round(100*$numrequests/$totalrequests) . "%</td>" .
			"<td align=right>" . commaize($numrequests) . "</td>" .
			"<td align=right>" . formatSize(round($totalbytes/$numrequests)) . "kB</td>" .
			"</tr>";
	}
	return $sHtml . "</table>";
}


function percentFlash() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>sites using Flash:</div><table border=0 cellpadding=0 cellspacing=0>";
	foreach (archiveNames() as $archive) {
		$label = latestLabel($archive);
		$archivecond = "archive='$archive' and label='$label'";
		$num = doSimpleQuery("select count(*) from $gPagesTable where $archivecond and reqFlash > 0;");
		$total = doSimpleQuery("select count(*) from $gPagesTable where $archivecond;");
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentGA() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>sites using Google Analytics:</div><table border=0 cellpadding=0 cellspacing=0>";
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
		$sHtml .= "<tr><td align=right>$archive:</td> <td align=right>" . round(100*$num/$total) . "%</td></tr>";
	}
	return $sHtml . "</table>";
}


function percentNoJS() {
	global $gPagesTable, $gRequestsTable;
	$sHtml = "<div class=itagline>sites with no scripts:</div><table border=0 cellpadding=0 cellspacing=0>";
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
	$sHtml = "<div class=itagline>sites with no stylesheets:</div><table border=0 cellpadding=0 cellspacing=0>";
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
	$sHtml = "<div class=itagline>sites with the most JavaScript:</div><table border=0 cellpadding=0 cellspacing=0>";
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
	$sHtml = "<div class=itagline>sites with the most CSS:</div><table border=0 cellpadding=0 cellspacing=0>";
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
	$sHtml = "<div class=itagline>sites with the most Flash:</div><table border=0 cellpadding=0 cellspacing=0>";
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

?>
// HTML strings for each snippet
var gaSnippets = new Array();
gaSnippets.push("<?php echo percentFlash() ?>");
gaSnippets.push("<?php echo percentNoJS() ?>");
gaSnippets.push("<?php echo percentNoCSS() ?>");
gaSnippets.push("<?php echo mostJS() ?>");
gaSnippets.push("<?php echo mostCSS() ?>");
gaSnippets.push("<?php echo mostFlash() ?>");
gaSnippets.push("<?php echo percentGA() ?>");
gaSnippets.push("<?php echo imageFormats() ?>");

// The DOM element that is created from each snippet.
var gaSnippetElems = new Array();
var curSnippet;

function showSnippet(parentId, iSnippet) {
	var parent = document.getElementById(parentId);
	if ( ! parent ) {
		return;
	}

	if ( curSnippet ) {
		fade(curSnippet, true);
	}

	if ( "undefined" === typeof(iSnippet) ) {
		iSnippet = Math.floor(gaSnippets.length * Math.random());
	}
	else if ( iSnippet >= gaSnippets.length ) {
		iSnippet = 0;
	}
	else if ( 0 > iSnippet ) {
		iSnippet = gaSnippets.length - 1;
	}

	var newSnippet = gaSnippetElems[iSnippet];
	if ( "undefined" === typeof(newSnippet) ) {
		newSnippet = document.createElement('div');
		newSnippet.id = iSnippet;
		gaSnippetElems[iSnippet] = newSnippet;
		newSnippet.className = "ianswer";
		newSnippet.innerHTML = gaSnippets[iSnippet] + 
			"<div style='margin-top: 4px;'>" +
			"<a href='javascript:showSnippet(\"" + parentId + "\"," + (iSnippet-1) + ")'>&lt;&lt; prev</a>" +
			"<span style='margin: 0 16px 0 16px;'>more stats</span>" +
			"<a href='javascript:showSnippet(\"" + parentId + "\"," + (iSnippet+1) + ")'>next &gt;&gt;</a>" +
			"</div>";
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
