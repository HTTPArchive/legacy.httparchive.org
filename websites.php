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

$gArchive = "All";
$gLabel = getParam('l', latestLabel($gArchive));
$gChar = getParam('c', 'A');
$gLcChar = strtolower($gChar);
$gTitle = "Web Sites";
$gMaxUrls = 20000;
?>
<!doctype html>
<html>
<head>
<title><?php echo genTitle($gTitle) ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="style.css" />
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<style>
.websites { 
	list-style-type: none; }
#alphaindex { 
	font-size: 0.9em;
	text-align: center;
	position: fixed; 
	left: 0; }
@media all and (max-height: 805px) {
	#alphaindex {
		overflow-y: scroll;
	}
}
@media all and (min-height: 300px) and (max-height: 400px) {
	#alphaindex {
		height: 106px;
	}
}
@media all and (min-height: 400px) and (max-height: 500px) {
	#alphaindex {
		height: 206px;
	}
}
@media all and (min-height: 500px) and (max-height: 600px) {
	#alphaindex {
		height: 306px;
	}
}
@media all and (min-height: 600px) and (max-height: 700px) {
	#alphaindex {
		height: 406px;
	}
}
@media all and (min-height: 700px) and (max-height: 800px) {
	#alphaindex {
		height: 506px;
	}
}
@media all and (min-height: 800px) and (max-height: 888px) {
	#alphaindex {
		height: 606px;
	}
}
#alphaindex > UL { 
	list-style-type: none; }
#alphaindex a {
	font-weight: bold;
	color: #004D92;
	padding: 0 20px 0 10px; }
#alphaindex a:focus, #alphaindex a:hover {
	color: #004D92;
    border-bottom: 0; }
#alphaindex li {
	border: 1px solid #FFF;
	margin-bottom: 0; }
#alphaindex li:focus, #alphaindex li:hover {
	border: 1px solid #3C7DC8; }
#alphaindex .selected {
	background: #3C7DC8; }
#alphaindex .selected A {
	color: #FFF; }
#alphaindex LI.selected {
	border: 1px solid #3C7DC8; }
</style>


        <!-- CSS  -->
        <link rel="stylesheet" type="text/css" 
              href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/themes/cupertino/jquery-ui.css"/>

        <!-- JS -->
        <script src="http://www.google.com/jsapi"></script>
        <script>
            // Load jQuery
            google.load("jquery", "1.5.1");
            google.load("jqueryui", "1.8.1");
        </script>
        <style>
            #formWrapper {  
                padding:10px; position:absolute; float:left; background-color:orchid;  
                background:rgba(255, 0, 0, 0.4);
                -moz-border-radius:10px;  
                -webkit-border-radius:10px; 
                border-radius:10px;  
            }  
            #formWrapper span {  
                display:block; 
                width:400px; 
                padding:10px 0; 
                margin:0 0 20px;  
                text-indent:20px; 
                font:22px Georgia, Serif; 
                color:#fff;  
            }  

            #formWrapper input {  
                display:block; 
                width:370px; 
                padding:3px; 
                margin-top: -22px;
                margin-left: 35px;
                border:1px solid #aaa;  
            } 
            .ui-autocomplete-loading { background: white url('images/ui-anim_basic_16x16.gif') right center no-repeat; }
        </style>
        <script>
            $(function() {
                $( "#site" ).autocomplete({
                    source: "findurl.php",
                    minLength: 2,
                    select: function( event, ui ) {
                        document.location = "viewsite.php?pageid=" + ui.item["data-pageid"];
                    }
                });
            });
        </script>

<style>
TABLE { border: 0; width: auto; }
tr:nth-child(2n+1) td { background: none; }
TD { padding-top: 0; padding-bottom: 0; }
.ui-widget, .ui-menu-item{ font-size: 1em; }
</style>

<table cellpadding=0 cellspacing=0 border=0 style="width: auto;">
<tr>
<td style="font-weight: bold;">
<?php
$query = "select count(distinct(url)) from $gPagesTable where archive = '$gArchive';";
$count = doSimpleQuery($query);
echo "$count total URLs";
?>
</td>
<td style="padding-left: 40px;">
  <div class="ui-widget" style="font-size: 1em;">
    <label for="birds" style="vertical-align: baseline;">find URL: </label>
    <input id="site" style="vertical-align: baseline;"/>
  </div>
</td>
</tr>
</table>

<div id=alphaindex>
<ul>
  <li<?php echo ( $gChar === "0" ? " class=selected" : "" ) ?>> <a href='?c=0'>0-9</a>
<?php
for ( $i = 65; $i <= 90; $i++ ) {
	$char = chr($i);
	echo "<li" . ( $gChar === $char ? " class=selected" : "" ) . "> <a href='?c=$char'>$char</a>\n";
}
?>
</ul>
</div>

<a name='top'></a>
<ul class=websites>
<?php
$query = "select max(pageid) as pageid, url from $gPagesTable where archive = '$gArchive' and (" .
	( "w" === $gLcChar ? "(url like 'http://w%' and url not like 'http://www.%')" : "url like 'http://$gLcChar%'" ) .
	" or url like 'http://www.$gLcChar%') group by url order by url asc limit $gMaxUrls;";
if ( "0" === $gChar ) {
	$query = "select max(pageid) as pageid, url from $gPagesTable where archive = '$gArchive' and url like 'http://www.%' and url not regexp 'http://www.[a-z]' and url not regexp 'http://www.[A-Z]' group by url order by url asc limit $gMaxUrls;";
}
$result = doQuery($query);
$lastMark = "";
while ($row = mysql_fetch_assoc($result)) {
	$url = $row['url'];
	if ( ereg('http://www\.([a-z])', $url, $regs) ) {
		$curMark = $regs[1];
		if ( $curMark != $lastMark ) {
			echo "<a name='" . strtoupper($curMark) . "'></a>\n";
			$lastMark = $curMark;
		}
	}
	echo "<li> <a href='viewsite.php?pageid=" . $row['pageid'] . "'>" . shortenUrl($url) . "</a>\n";
}
mysql_free_result($result);
?>
</ul>

<?php echo uiFooter() ?>

</body>
</html>
