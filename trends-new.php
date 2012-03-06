<?php

function cssPath($file) { return "bootstrap/bootstrap/css/" . $file; }
function jsPath($file) { return "bootstrap/bootstrap/js/" . $file; }
require_once("ui.inc");
require_once("utils.inc");

$gTitle = "HTTP Archive";

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
    <style type="text/css">
      body {
        padding-top: 60px;
        padding-bottom: 40px;
      }
    </style>
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
          <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </a>
          <a class="brand" href="index.php">HTTP Archive</a>
          <div class="nav-collapse">
            <ul class="nav">
              <li><a href="index.php">Home</a></li>
              <li><a href="trends.php">Trends</a></li>
              <li><a href="interesting.php">Stats</a></li>
              <li><a href="websites.php">Websites</a></li>
              <li class="active"><a href="about.php">About</a></li>
            </ul>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>

    <div class="container">


      <hr>

      <footer>
        <p>The HTTP Archive is <a href="about.php#sponsors">sponsored by</a> 
        <a title="Google" href="http://www.google.com/">Google</a>,
        <a title="Mozilla" href="http://www.mozilla.org/firefox">Mozilla</a>,
        <a title="New Relic" href="http://www.newrelic.com/">New Relic</a>,
        <a title="O'Reilly Media" href="http://oreilly.com/">O&#8217;Reilly Media</a>,
        <a href="http://www.etsy.com/">Etsy</a>,
        <a title="Strangeloop Networks" href="http://www.strangeloopnetworks.com/">Strangeloop</a>,
        <a title="dynaTrace Software" href="http://www.dynatrace.com/">dynaTrace Software</a>, and
        <a title="Torbit" href="http://torbit.com/">Torbit</a>, and powered by <a href="http://www.webpagetest.org">WebPagetest</a>.
      </footer>

    </div> <!-- /container -->

    <!-- Le javascript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="<?php echo jsPath('jquery.js'); ?>"></script>
    <script src="<?php echo jsPath('bootstrap.js'); ?>"></script>
<script type="text/javascript">

    $('#statsCarousel').carousel();


</script>
  </body>
</html>
