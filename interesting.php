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

$gArchive = "All";
$gLabel = ( array_key_exists("l", $_GET) ? $_GET["l"] : latestLabel($gArchive) );
$gTitle = "Interesting Stats";
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title>HTTP Archive - <?php echo $gTitle ?></title>
	<meta charset="UTF-8">
<style>
.chart { 
	border: 1px solid #BBB; 
	padding: 4px; 
	margin-bottom: 40px; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>

<h1>Interesting stats</h1>

<p>
Got a stat you'd like to see?
<a href="http://code.google.com/p/httparchive/issues/entry?summary=New+Interesting+Stat&comment=Here%27s%20an%20interesting%20stat%20I%27d%20like%20to%20see%3A" target="_blank">Suggest it!</a>
</p>

<form>
	<label>Choose a run:</label>
	<?php echo selectArchiveLabel($gArchive, $gLabel); ?>
</form>

<div id=interesting style="margin-top: 40px;">
<!-- interesting.js will insert interesting stats here -->
</div>


<?php echo uiFooter() ?>

<script>
function showSnippets() {
	parent = document.getElementById('interesting');
	for ( var iSnippet = 0; iSnippet < gaSnippets.length; iSnippet++ ) {
		newSnippet = document.createElement('div');
		newSnippet.id = iSnippet;
		newSnippet.className = "ianswer";
		newSnippet.innerHTML = gaSnippets[iSnippet];
		parent.appendChild(newSnippet);
	}
}

var script2 = document.createElement('script');
script2.src = "interesting.js?l=<?php echo $gLabel ?>";
script2.onload = showSnippets;
document.getElementsByTagName('head')[0].appendChild(script2);
</script>

</body>

</html>

