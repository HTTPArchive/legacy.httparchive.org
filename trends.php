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

require_once("ui.inc");
require_once("utils.inc");
require_once("crawls.inc");

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

<div style="float:right; margin-right: 10em;">
<a href="about.php#bigquery">Write your own custom queries!</a>
</div>

<h1>Trends</h1>


<?php
if ( $gbDev || $gbDesktop ) {
	echo "<p style='font-weight: bold; color: #800; margin-bottom: 0.5em;'>NOTE: Test agents switched from IE 9 to Chrome as of March 1 2016.</p>\n";
}
else if ( $gbMobile ) {
	echo "<p style='font-weight: bold; color: #800; margin-bottom: 0.5em;'>NOTE: Test agents switched from iPhone 4 to emulated Android as of March 1 2016.</p>\n";
}
?>

<form>
<div>
	<label>Choose URLs:</label>
<?php
echo selectSlice($gSlice, "", "s");
?>

<label style="margin-left: 1em;">Start:</label>
	<?php echo selectArchiveLabel($gArchive, minLabel(), false, false, "minlabel"); ?>

<label style="margin-left: 1em;">End:</label>
	<?php echo selectArchiveLabel($gArchive, maxLabel(), false, false, "maxlabel"); ?>
<input style="margin-left: 1em;" class=button type=submit value="Submit">
</div>
</form>


<?php
$gUrl = NULL; // TODO - get rid of this
require_once('trends.inc');
?>



<?php echo uiFooter() ?>

</body>

</html>

