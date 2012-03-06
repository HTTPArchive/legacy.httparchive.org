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

function cssPath($file) { return "bootstrap/bootstrap/css/" . $file; }
function jsPath($file) { return "bootstrap/bootstrap/js/" . $file; }
require_once("ui.inc");
require_once("utils.inc");

$gArchive = "All";
$gSlice = getParam('s', 'All');
$gTitle = "Trends";
$gMinLabel = ( array_key_exists("minlabel", $_GET) ? $_GET['minlabel'] : "" );
$gMaxLabel = ( array_key_exists("maxlabel", $_GET) ? $_GET['maxlabel'] : latestLabel() );
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>HTTPArchive</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Le styles -->
    <link href="<?php echo cssPath('bootstrap.css'); ?>" rel="stylesheet">
    <link href="<?php echo cssPath('bootstrap-responsive.css'); ?>" rel="stylesheet">

    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="<?php echo jsPath('html5.js'); ?>"></script>
    <![endif]-->

    <?php /* TODO - do we have touch icons? */ ?>
    <link rel="shortcut icon" href="images/favicon.ico">
    <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
    <link rel="apple-touch-icon" sizes="72x72" href="images/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="114x114" href="images/apple-touch-icon-114x114.png">
  </head>

<body>
    <div class="navbar navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <a class="brand" href="index.php">HTTP Archive</a>
          <div class="nav-collapse">
            <ul class="nav">
              <li><a href="index.php">Home</a></li>
              <li class="active"><a href="trends.php">Trends</a></li>
              <li><a href="interesting.php">Stats</a></li>
              <li><a href="websites.php">Websites</a></li>
              <li><a href="about.php">About</a></li>
            </ul>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>
<div style="margin-top: 60px" class="container-fluid"><div class="row-fluid">
    <div class="span2">
    <div class="well sidebar-nav">
      <ul class="nav nav-list">
        <li class="nav-header">Trend charts</li>
        <li><a href="#numurls">URLs Analyzed</a></li>
        <li><a href="#bytesTotal&reqTotal">Total bytes/reqs</a></li>
        <li><a href="#bytesHtml&reqHtml">HTML bytes/reqs</a></li>
        <li><a href="#bytesJS&reqJS">JS bytes/reqs</a></li>
        <li><a href="#bytesCSS&reqCSS">CSS bytes/reqs</a></li>
        <li><a href="#bytesImg&reqImg">Total image bytes and requests</a></li>
        <li><a href="#PageSpeed">Page Speed</a></li>
        <li><a href="#numDomains"># domains</a></li>
        <li><a href="#perGlibs">Goog libs</a></li>
        <li><a href="#perFlash">Flash</a></li>
        <li><a href="#perFonts">Goog fonts</a></li>
        <li><a href="#maxageNull">Maxagenull</a></li>
        <li><a href="#perHttps">Https</a></li>
        <li><a href="#perErrors">Errors</a></li>
        <li><a href="#perRedirects">Redirects</a></li>
      </ul>
    </div>

    </div>
    <div class="span10">
    </div>
</div></div></body>

<div class="container">



        <h1>Trends</h1>


        <form>
        <div>
            <label>Choose URLs:</label>
        <?php
        echo selectSlice($gSlice, "", "s");
        ?>

        <label style="margin-left: 1em;">Start:</label>
            <?php echo selectArchiveLabel($gArchive, $gMinLabel, false, false, "minlabel"); ?>

        <label style="margin-left: 1em;">End:</label>
            <?php echo selectArchiveLabel($gArchive, $gMaxLabel, false, false, "maxlabel"); ?>
        <input style="margin-left: 1em;" class=button type=submit value="Submit">
        </div>
        </form>

        <?php
        $gUrl = NULL; // TODO - get rid of this
        require_once('trends.inc');
        ?>

    </div>
    <?php echo uiFooter() ?>
    </div> <!-- /container -->

    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="<?php echo jsPath('../../docs/assets/js/jquery.js'); ?>"></script>
    <script src="<?php echo jsPath('bootstrap.js'); ?>"></script>
<script type="text/javascript">

    $('.dropdown-toggle').dropdown();

</script>
  </body>
</html>
