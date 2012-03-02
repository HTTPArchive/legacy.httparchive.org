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
              <li class="active"><a href="index.php">Home</a></li>
              <li><a href="trends.php">Trends</a></li>
              <li><a href="interesting.php">Stats</a></li>
              <li><a href="websites.php">Websites</a></li>
              <li><a href="about.php">About</a></li>
            </ul>
          </div><!--/.nav-collapse -->
        </div>
      </div>
    </div>

    <div class="container">
        <h1>The HTTP Archive tracks how the web is built.</h1>

      <!-- Main hero unit for a primary marketing message or call to action -->
      <div class="row">
      <div class="span8 offset2">
        <div id="statsCarousel" class="carousel">
            <?php
                require_once("stats.inc");
                require_once("charts.inc");
                $hStats = getStats(latestLabel("All"), "All", ($gbMobile ? "iphone" : "IE8"));
            ?>
            <div class="carousel-inner">
                <div class="active item">
                    <a class=image-link href='interesting.php'><?php echo bytesContentTypeChart($hStats) ?></a>
                    <div class="carousel-caption">
                        <h4>Bytes per Page by Content Time</h4>
                    </div>
                </div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo responseSizes($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo percentGoogleLibrariesAPI($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo percentFlash($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo percentFonts($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo popularImageFormats($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo maxage($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo percentByProtocol($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo requestErrors($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo redirects($hStats) ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo correlationChart($hStats, "onLoad") ?></a></div>
                <div class="item"><a class=image-link href='interesting.php'><?php echo correlationChart($hStats, "renderStart") ?></a></div>
            </div>
            <a class="left carousel-control" href="#statsCarousel" data-slide="prev">&lsaquo;</a>
            <a class="right carousel-control" href="#statsCarousel" data-slide="next">&rsaquo;</a>
        </div>
      </div>
      </div>

      <!-- Example row of columns -->
      <div class="row">
        <div class="span4">
          <h2>Trends in web technology</h2>
           <p>Load times, download sizes, performance scores</p>
          <p><a class="btn" href="trends.php">View details &raquo;</a></p>
        </div>
        <div class="span4">
          <h2>Interesting stats</h2>
           <p>Popular scripts, image formats, errors, redirects</p>
          <p><a class="btn" href="interesting.php">View details &raquo;</a></p>
       </div>
        <div class="span4">
          <h2>Website performance</h2>
          <p>Specific URL screenshots, waterfall charts, HTTP headers</p>
          <p><a class="btn" href="websites.php">View details &raquo;</a></p>
        </div>
      </div>

        <h3>The HTTP Archive code is <a href="http://httparchive.googlecode.org">open source</a> and the data is <a href="">downloadable</a></h3>

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
