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

require_once("ui.inc");
require_once("utils.inc");

$gArchive = "All";
$gSlice = getParam('s', 'All');
$gTitle = "Trends";
?>
<!doctype html>
<html>
<head>
<title><?php echo genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
</head>

<body>

<?php echo uiHeader($gTitle); ?>

<h1>Trends</h1>


<div style="float: left; margin-right: 20px;">
<form>
	<label>Choose URLs:</label>
<?php
echo selectSlice($gSlice, "onchange='document.location=\"?s=\"+escape(this.options[this.selectedIndex].value)'");
?>
</form>
</div>
<div style="font-size: 0.9em;">
<?php
if ( "intersection" != $gSlice ) {
	echo "use \"intersection\" to trend the exact same URLs over time";
}
?>
</div>

<?php
require_once('trends.inc');
?>



<?php echo uiFooter() ?>

</body>

</html>

