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

$gTitle = "Interesting Stats";
?>
<!doctype html>
<html>
<head>
<title><?php echo $gTitle ?></title>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
<?php echo globalCss(); ?>
<style>
.ianswer { font-size: 0.9em; padding: 6px; margin-bottom: 20px; }
.ianswer TD { padding: 0 4px 0 4px; }
.itagline { font-weight: bold; margin-bottom: 4px; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>

<p>
Here are some interesting stats culled from the archives.
</p>

<div id=interesting>
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
script2.src = "interesting.js";
script2.onload = showSnippets;
document.getElementsByTagName('head')[0].appendChild(script2);
</script>

</body>

</html>

