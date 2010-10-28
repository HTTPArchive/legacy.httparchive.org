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

$gTitle = "Downloads";
?>
<!doctype html>
<html>
<head>
	<link type="text/css" rel="stylesheet" href="style.css" />
	
	<title><?php echo $gTitle ?></title>
	<meta charset="UTF-8">
</head>

<body>

<?php echo uiHeader($gTitle); ?>
<h1>Downloads</h1>
<p>
All <a href="viewarchive.php">Archive tables</a> and the tables for each site have a "download CSV" link next to them.
</p>

<p>
In addition, you can download the entire are has a <a href="httparchive_mysqldump.gz">compressed mysqldump</a>
</p>

<?php echo uiFooter() ?>

</body>

</html>

