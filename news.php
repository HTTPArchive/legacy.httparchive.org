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

$gTitle = "News";
?>
<!doctype html>
<html>
<head>	
<title><?php echo $gTitle ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
<style>
DT { font-weight: bold; margin-top: 20px; }
DD { margin-left: 40px; }
</style>
</head>

<body>

<?php echo uiHeader($gTitle); ?>
<h1><?php echo $gTitle ?></h1>

<dl id=news>
  <dt> March 25, 2011: har_to_pagespeed updated
  <dd> Page Speed updated
<p>
We used to run <a href="http://code.google.com/p/page-speed/">har_to_pagespeed</a> to generate Page Speed scores.
With this change the Page Speed scores are generated from WebPagetest. 
This means that more rules are evaluated and the score is more informative.
When using har_to_pagespeed the input is a HAR file so any rules requiring access to the page's DOM can not be scored.
WebPagetest, however, generates the Page Speed score while the page's DOM is available, thus resulting in a more accurate evaluate of the page's performance.
</p>
<p>
One side effect of this change is that comparisons of Page Speed scores to runs performed before March 25 are not apples-to-apples comparisons 
because this change in which rules are evaluated.
</p>
</dl>


<?php echo uiFooter() ?>

</body>

</html>

