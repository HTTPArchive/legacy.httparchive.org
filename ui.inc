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


require_once("utils.inc");


function genTitle($addl = "") {
	global $gbMobile;

	return "HTTP Archive " . 
		( $gbMobile ? "Mobile " : "" ) . 
		( $addl ? " - $addl" : "" );
}


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


// HTML to insert first inside the HEAD element.
function headfirst() {
	$sHtml = "";

	// Google Analytics
	if ( ! isPrivateInstance() ) {
		$sHtml = <<<OUTPUT
<script type="text/javascript">
// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-22381566-1']);
_gaq.push(['_setDomainName', '.httparchive.org']);
_gaq.push(['_trackPageview']);
_gaq.push(['_trackPageLoadTime']);
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
</script>

OUTPUT;
	}

	$sHtml .= <<<OUTPUT
<script type="text/javascript">
function loadScript(url, callback) {
	var sNew = document.createElement("script");
	sNew.async = true;
	sNew.src = url;
	if ( "function" === typeof(callback) ) {
		sNew.onload = function() {
			callback();
			sNew.onload = sNew.onreadystatechange = undefined; // clear it out to avoid getting called twice
		};
		sNew.onreadystatechange = function() {
			if ( "loaded" === sNew.readyState || "complete" === sNew.readyState ) {
				sNew.onload();
			}
		}
	}
	var s0 = document.getElementsByTagName('script')[0];
	s0.parentNode.insertBefore(sNew, s0);
}

var _jqueryq = [];
function doJquery() {
	for ( var i=0; i < _jqueryq.length; i++ ) {
		var cmd = _jqueryq[i];
		doCommand(cmd);
	}
	_jqueryq = undefined; // as a flat that future commands should be done immediately
}

function addCommand(cmd) {
	if ( "undefined" === typeof(_jqueryq) ) {
		doCommand(cmd);
	}
	else {
		_jqueryq.push(cmd);
	}
}

function doCommand(cmd) {
	if ( "function" === typeof(cmd) ) {
		cmd();
	}
	else if ( "string" === typeof(cmd) ) {
		// Eval a string of JavaScript in the proper context.
		if (window.execScript) {
			window.execScript(cmd);
		}
		else {
			var fn = function() {
				window.eval.call(window, cmd);
			};
			fn();
		}
	}
}

loadScript("http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js");
</script>

<!--[if lt IE 9]>
<script>
// we use some new HTML tags - make them work in IE<9 - hrrmphf
var e = ("abbr,article,aside,audio,canvas,datalist,details,figure,footer,header,hgroup,mark,menu,meter,nav,output,progress,section,time,video").split(',');
for (var i = 0; i < e.length; i++) {
	document.createElement(e[i]);
}
</script>
<![endif]-->

OUTPUT;

    return $sHtml;
}


function uiHeader($title = "HTTP Archive", $bNavlinks = true, $extraNav='') {
	global $gbMobile;

	$navlinks = "";
	if ( $bNavlinks ) {
		// Make sure to echo the drop down list of "About" links in about.php.
		$navlinks = '
<nav>
<ul>
  <li> <a id="trendsnav" href="trends.php">Trends</a>
  <li> <a id="statsnav" href="interesting.php">Stats</a>
  <li><a id="websitesnav" href="websites.php">Websites</a>
  <li id="aboutnav" onmouseover="document.getElementById(\'aboutdropdown\').style.display=\'block\';" onmouseout="document.getElementById(\'aboutdropdown\').style.display=\'none\';"><a href="about.php">About</a>
    <ul id="aboutdropdown">
 	  <li><a href="about.php#mission">Mission</a></li>
	  <li><a href="about.php#faq">FAQ</a></li>
 	  <li><a href="downloads.php">Download Data</a></li>
 	  <li><a href="urls.php">URLs</a></li>
 	  <li><a href="http://code.google.com/p/httparchive/source/browse">Source Code</a></li>
 	  <li><a href="http://code.google.com/p/httparchive/issues/list">Bugs</a></li>
 	  <li><a href="http://groups.google.com/group/httparchive/topics">Contact Us</a></li>
 	</ul>
  </li>
</ul>
</nav>';
	}

	$mobile = "";
	$version = "BETA";
	if ( $gbMobile ) {
		$mobile = "<div class=mobilelabel>MOBILE</div>";
		$version = "ALPHA";
	}

	if ( $version ) {
		$version = "<div style='position: absolute; width: 211px; top: 20px; text-align: right;'>$version</div>";
	}

	return <<<OUTPUT
    <header>
$version
		<a href="index.php" id="logo" style="line-height: 0.7em;">HTTP Archive</a>
		$mobile
		$navlinks
	</header>

OUTPUT;
}


function uiFooter() {
	return <<<OUTPUT
<footer style="text-align: center;">
<a href="about.php#sponsors">sponsors</a>: 
<a title="Google" href="http://www.google.com/">Google</a>,
<a title="Mozilla" href="http://www.mozilla.org/firefox">Mozilla</a>,
<a title="New Relic" href="http://www.newrelic.com/">New Relic</a>,
<a title="O'Reilly Media" href="http://oreilly.com/">O&#8217;Reilly Media</a>,
<a href="http://www.etsy.com/">Etsy</a>,
<a title="Strangeloop Networks" href="http://www.strangeloopnetworks.com/">Strangeloop</a>,
<a title="dynaTrace Software" href="http://www.dynatrace.com/">dynaTrace Software</a>, and
<a title="Torbit" href="http://torbit.com/">Torbit</a>.
<br>
powered by <a href="http://www.webpagetest.org">WebPagetest</a>
</footer>
OUTPUT;
}

?>
