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


function uiHeader($title = "HTTP Archive", $bNavlinks = true, $extraNav='') {
	$navlinks = "";
	if ( $bNavlinks ) {
		$navlinks = '
<nav>
	<ul>
		<li><a href="about.php">about</a></li>
		<li><a href="http://groups.google.com/group/httparchive/topics">contact</a></li>
		<li><a href="http://code.google.com/p/httparchive/">code</a></li>
    </ul>
</nav>';
	}
	
	return <<<OUTPUT
    <header>
		<a href="index.php" id="logo">HTTP Archive</a>
		$navlinks
	</header>

OUTPUT;
}


function uiFooter() {
	return <<<OUTPUT
OUTPUT;
}

?>