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

/*
DESCRIPTION: 
Return a JavaScript array of image URLs for charts.
*/

$gLabel = getParam('l', latestLabel($gArchive));
$gSlice = getParam('s', 'All');
$gJsonP = getParam('jsonp', '');

require_once("stats.inc");
require_once("charts.inc");
$hStats = getStats($gLabel, $gSlice, ($gbMobile ? "iphone" : "IE8"));
?>
// HTML strings for each image
var gaSnippets = new Array();

gaSnippets.push("<?php echo bytesContentTypeChart($hStats) ?>");
gaSnippets.push("<?php echo responseSizes($hStats) ?>");
gaSnippets.push("<?php echo percentGoogleLibrariesAPI($hStats) ?>");
gaSnippets.push("<?php echo percentFlash($hStats) ?>");
gaSnippets.push("<?php echo percentFonts($hStats) ?>");
gaSnippets.push("<?php echo popularImageFormats($hStats) ?>");
gaSnippets.push("<?php echo maxage($hStats) ?>");
gaSnippets.push("<?php echo percentByProtocol($hStats) ?>");
gaSnippets.push("<?php echo requestErrors($hStats) ?>");
gaSnippets.push("<?php echo redirects($hStats) ?>");
gaSnippets.push("<?php echo correlationChart($hStats, "onLoad") ?>");
gaSnippets.push("<?php echo correlationChart($hStats, "renderStart") ?>");

<?php
if ( $gJsonP ) {
	echo "\n$gJsonP(gaSnippets);\n";
}
?>

