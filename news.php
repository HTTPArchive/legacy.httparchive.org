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
<title><?php echo genTitle($gTitle) ?></title>
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
  <dt> June 1, 2011: HTTP Archive Mobile grows from top 100 to top 1000 URLs.

  <dt> May 13, 2011: <a href="http://www.stevesouders.com/blog/2011/05/13/http-archive-mobile/">HTTP Archive Mobile</a>
  <dd> The "alpha" version of HTTP Archive Mobile is announced at the Mobilism conference in Amsterdam. 
Initial runs are of the world's top 100 sites.

  <dt> April 8, 2011: <a href="http://news.cnet.com/8301-30685_3-20052018-264.html">CNET News Flash use dips at top Web sites since November</a>
  <dd> <p> Article published on CNET News citing various statistics from the HTTP Archive.

  <dt> April 5, 2011: hide small runs
  <dd> <p>The first three runs in the HTTP Archive (Oct 5, Oct 22, and Nov 6) only had ~1000 URLs.
Comparing those small runs to the later larger runs (that have ~17,000 URLs) can be misleading.
(See this <a href="http://www.stevesouders.com/blog/2011/04/05/http-archive-url-list-flash-trends/">blog post</a>.)
This change removes those first three runs from the UI to avoid these confusing comparisons.
The data is still <a href="downloads.php">downloadable</a>.</p>

  <dt> March 25, 2011: Page Speed updated
  <dd>
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

