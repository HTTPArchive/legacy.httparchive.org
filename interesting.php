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
require_once("queries.php");

$gTitle = "Interesting Stats";
?>
<!doctype html>
<html>
<head>
<title><?php echo $gTitle ?></title>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
<?php echo globalCss(); ?>

</head>

<body>

<?php echo uiHeader($gTitle); ?>

<p>
<?php
echo interestingQueries(true);
?>

<?php echo uiFooter() ?>

</body>

</html>

