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
require_once("utils.inc");

$gTitle = "URLs";
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

<p>

</p>

<?php
$gStart = ( array_key_exists("start", $_GET) ? $_GET["start"] : 1 );
if ( $gStart < 1 ) {
   $gStart = 1;
}

$gEnd = ( array_key_exists("end", $_GET) ? $_GET["end"] : 10 );
$gMax = 10000;
if ( $gEnd > $gMax ) {
   $gEnd = $gMax;
}

$gbNums = array_key_exists("nums", $_GET);
?>

<style>
TABLE { border-bottom: 0; }
TR { vertical-align: middle; }
TD { padding: 0 0.5em 0.5em 0; border-bottom: 0; vertical-align: middle; }
INPUT { padding: 0; margin: 0; }
</style>

<table cellpadding=0 cellspacing=0 border=0 style="width: auto;">
<form action="">
<tr> <td style="text-align: right;">start:</td> <td><input type=text size=7 id=start name=start value="<?php echo $gStart ?>" style="text-align: right;"></td> </tr>
<tr> <td style="text-align: right;">end:</td> <td><input type=text size=7 id=end name=end value="<?php echo $gEnd ?>" style="text-align: right;"></td> </tr>
<tr> <td colspan=2><input type=checkbox id=nums name=nums<?php echo ($gbNums ? " checked" : "") ?>> include numbers</td> </tr>
<tr> <td colspan=2><input type=submit value="Generate List"></td> </tr>
</form>
</table>

<pre>
<?php
$query = "select rank, urlOrig, urlFixed from $gUrlsTable where rank >= $gStart and rank <= $gEnd order by rank asc;";
$result = doQuery($query);
while ($row = mysql_fetch_assoc($result)) {
	echo ( $gbNums ? $row['rank'] . "," : "" ) . ( $row['urlFixed'] ? $row['urlFixed'] : $row['urlOrig'] ) . "\n";
}
mysql_free_result($result);
?>
</pre>

<?php echo uiFooter() ?>

</body>

</html>

