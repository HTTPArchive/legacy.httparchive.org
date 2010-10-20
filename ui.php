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

function globalCss() {
	return <<<OUTPUT
<style>
BODY { font-family: Arial; }
.header { border-bottom: 4px groove #17598F; font-size: 3em; color: #17598F; }
.preheader { font-size: 0.8em; }
.notification { color: #C00; }
.tdnum { text-align: right; }
</style>

OUTPUT;
}


function uiHeader($title = "HTTP Archive", $bNavlinks = true) {
	$navlinks = "";
	if ( $bNavlinks ) {
		$navlinks = <<<OUTPUT
<div style="float: right; font-size: 0.8em;">
<a href="index.php">home</a>
&nbsp;|&nbsp;
<a href="viewarchive.php">archives</a>
&nbsp;|&nbsp;
<a href="about.php">about</a>
</div>
OUTPUT;
	}
	
	return <<<OUTPUT
<table cellpadding=0 cellspacing=0 border=0 style="width: 800px;">
  <tr>
    <td valign=top style="padding-right: 10px; text-align:center;">
      <a href="index.php"><img border=0 src='images/httparchive-49x47.png' width=49 height=47 style="margin-top: 4px;"></a>
<div style="line-height: 90%; margin-top: 2px; font-size: 11pt;">
<a href="index.php" style="text-decoration: none; color: #17598F; font-weight: bold;">HTTP
<br>
Archive
</a>
</div>
    </td>
    <td valign=top style="width: 100%">
	  $navlinks
      <div class=header><nobr><strong>$title</strong></nobr></div>
    </td>
  </tr>
</table>

OUTPUT;
}


function uiFooter() {
	return <<<OUTPUT
	<footer>
		<ul>
			<li><a href="about.php">about</a></li>
			<li><a href="http://code.google.com/p/httparchive/issues/list">bugs</a></li>
			<li><a href="http://code.google.com/p/httparchive/source/checkout">code</a></li>
			<li><a href="http://groups.google.com/group/httparchive/topics">contact us</a></li>
		</ul>
	</footer>
OUTPUT;
}

?>