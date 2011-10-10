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

$gTitle = "Remove Your Site";
$gRurl = ( array_key_exists('rurl', $_GET) ? $_GET['rurl'] : '' );
$is_valid_url = false;
$url_to_fetch = "";
$is_crawlable = true;
if ( $gRurl ) {
	// Do some basic validation
	$is_valid_url = preg_match("/^(http|https):\/\/([A-Z0-9][A-Z0-9_-]*(?:\.[A-Z0-9][A-Z0-9_-]*)+):?(\d+)?\/?/i", $gRurl);
  
	if ( $is_valid_url ) {
		// make sure we have a trailing slash
		$url_to_fetch = substr($gRurl, -1) == '/' ? $gRurl : $gRurl . '/';
		$url_to_fetch .= 'removehttparchive.txt';
		$is_crawlable = ( FALSE === @file($url_to_fetch) );
	}
}

?>
<!doctype html>
<html>
<head>
<title><?php echo $gTitle ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />

<!-- autocomplete URL picker -->
<link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/themes/cupertino/jquery-ui.css"/>
<script>
// Load jQuery
// jquery.min.js loaded elsewhere
// google.load("jquery", "1.5.1");
google.load("jqueryui", "1.8.1");
</script>
<style>
.ui-autocomplete-loading { 
	background: white url('images/ui-anim_basic_16x16.gif') right center no-repeat; }
</style>
<script>
$(function() {
		$( "#rurl" ).autocomplete({ source: "findurl.php",
					minLength: 2 });
	});
</script>
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<h1><?php echo $gTitle ?></h1>

<?php
if ( $gRurl ) {
	if ( ! $is_valid_url ) {
		echo "<p class=warning>The URL entered is invalid: $gRurl</p>\n";
	}
	else {
		if ( $is_crawlable ) {
			echo "<p class=warning><a href='$url_to_fetch'>$url_to_fetch</a> was not found.<br>$gRurl is still archived.</p>\n";
		}
		else {
			echo "<p class=warning style='margin-bottom: 0;'>$gRurl has been removed from the HTTP Archive.</p>\n<p style='margin-top: 0;'>You can remove removehttparchive.txt.</p>";
		}
	}
}
?>

<p>
Follow these steps to remove your website's data from the HTTP Archive and prevent further archiving.
</p>

<ol style="margin-left: 2em;">
<form action="<? echo $_SERVER['PHP_SELF'] ;?>">
  <li> Select your URL:
  <span class="ui-widget" style="font-size: 1em;">
    <input id="rurl" name="rurl" style="margin: 0;" size=35 />
  </span>

  <li> Create a file called <code>removehttparchive.txt</code> at that URL.

  <li> Click here: <input type="submit" value="Remove" name="submit" placeholder="http://www.example.com" style="margin: 0;" />
</form>
</ol>



<?php echo uiFooter() ?>

</body>
</html>
