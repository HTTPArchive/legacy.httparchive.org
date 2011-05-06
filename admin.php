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
require_once("ui.php");

$gTitle = "Admin";
?>
<!doctype html>
<html>
<head>
<title><?php genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<a href="admin.php?a=create">create MySQL tables</a>

<div style="margin-top: 40px;">
<?php
$gAction = getParam('a');
if ( "create" === $gAction ) {
	echo "<p>Creating MySQL tables...<br>\n";
	createTables();
	if ( tableExists($gPagesTable) ) {
		echo "$gPagesTable created.<br>\n";
	}
	if ( tableExists($gRequestsTable) ) {
		echo "$gRequestsTable created.<br>\n";
	}
}
?>
</div>


<?php echo uiFooter() ?>

</body>
</html>
