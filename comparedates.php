<?php 
/*
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
require_once("pages.inc");

$gUrl = getParam('u');
$gLabel1 = getParam('label1');
$gLabel2 = getParam('label2');
$gWptid2 = getParam('wptid2');
if ( $gUrl && $gLabel1 && $gLabel2 && $gWptid2 ) {
	$pageData = pageData(null, $gUrl, $gLabel1);
	if ( ! $pageData ) {
		header('Location: websites.php?1');
		return;
	}
	else {
		$gWptid1 = $pageData['wptid'];
		header("Location: http://httparchive.webpagetest.org/video/compare.php?tests=$gWptid1-l:$gLabel1,$gWptid2-l:$gLabel2");
	}
}
else {
	// should never reach here
	header("Location: websites.php?u=$gUrl&l1=$gLabel1&l2=$gLabel2&w2=$gWptid2");
}
?>
