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

require_once(dirname(dirname(dirname(__FILE__))) . "/ui.inc");

$gTitle = "HTTP Archive API, v1";
?>
<!doctype html>
<html>
<head>
<title><?php echo $gTitle ?></title>
<meta charset="UTF-8">

<?php echo headfirst() ?>
<link type="text/css" rel="stylesheet" href="../../style.css" />
</head>

<body>
<?php echo uiHeader($gTitle); ?>

<h1>So you want to draw your own charts?</h1>
<h2>The HTTPArchive API is designed to let you do just that.</h2>

If you still have questions after reading alllll this, feel free to ask <a href="http://groups.google.com/group/httparchive/">the mailing list</a>.

<h3>/api/v1/trends.php</h3>

<h4>Inputs</h4>

<p>Required parameter: url=<url>, where url is a URL of the form http://www.google.com/. The scheme (http or https) and trailing slash are important because, for now, we require an <em>exact</em> match on what's in the database.

<p>Optional parameters:
<ul>
    <li><strong>'callback' := your JSONP callback</strong> If you need a jsonp callback, just pass the function name here. (<a href="http://www.google.com/?q=what+is+jsonp">What's JSONP?</a>)
    <li><strong>'set' := 'All' or 'intersection'.</strong> If you select a subset of sites, like Top100, over a range of dates, then 'intersection' shows only those sites that stayed in the Top100 across all dates; 'All' shows the union, i.e., all sites that were in the Top100 at one date, even if they weren't at another.</li>
    <li><strong>'device' := 'IE8' or 'iphone'</strong></li>
</ul>

<h4>Output</h4>

An example should probably be enough to get you started.

A request of the form: 

<pre>http://httparchive.org/api/v1/trends.php?callback=myData&url=http://www.cnn.com/</pre> 

yields this response:

<pre>
myData({
    "data": {
        "items": [{
            "date": "Dec 15 2011",
            "timestamp": 1323936000,
            "measurements": {
                "pageSpeed": "73",
                "numDomains": "26",
                "kBTransferred": {
                    "total": "593",
                    "html": "67",
                    "js": "162",
                    "css": "74",
                    "img": "275",
                    "flash": "15"
                },
                "numRequests": {
                    "total": "134",
                    "html": "32",
                    "js": "14",
                    "css": "2",
                    "img": "74",
                    "flash": "1"
                }
            }
        }, {
            "date": "Feb 1 2012",
            "timestamp": 1328083200,
            "measurements": {
                "pageSpeed": "79",
                "numDomains": "24",
                "kBTransferred": {
                    "total": "767",
                    "html": "67",
                    "js": "237",
                    "css": "40",
                    "img": "380",
                    "flash": "42"
                },
                "numRequests": {
                    "total": "146",
                    "html": "33",
                    "js": "11",
                    "css": "2",
                    "img": "90",
                    "flash": "2"
                }
            }
        }, {
            "date": "Feb 15 2012",
            "timestamp": 1329292800,
            "measurements": {
                "pageSpeed": "78",
                "numDomains": "26",
                "kBTransferred": {
                    "total": "890",
                    "html": "57",
                    "js": "252",
                    "css": "32",
                    "img": "384",
                    "flash": "164"
                },
                "numRequests": {
                    "total": "141",
                    "html": "31",
                    "js": "16",
                    "css": "1",
                    "img": "76",
                    "flash": "4"
                }
            }
        }, {
            "date": "Jan 1 2012",
            "timestamp": 1325404800,
            "measurements": {
                "pageSpeed": "72",
                "numDomains": "24",
                "kBTransferred": {
                    "total": "749",
                    "html": "78",
                    "js": "190",
                    "css": "74",
                    "img": "407",
                    "flash": "0"
                },
                "numRequests": {
                    "total": "141",
                    "html": "35",
                    "js": "9",
                    "css": "2",
                    "img": "88",
                    "flash": "0"
                }
            }
        }, {
            "date": "Jan 15 2012",
            "timestamp": 1326614400,
            "measurements": {
                "pageSpeed": "78",
                "numDomains": "23",
                "kBTransferred": {
                    "total": "767",
                    "html": "63",
                    "js": "189",
                    "css": "75",
                    "img": "367",
                    "flash": "71"
                },
                "numRequests": {
                    "total": "138",
                    "html": "29",
                    "js": "11",
                    "css": "2",
                    "img": "82",
                    "flash": "4"
                }
            }
        }, {
            "date": "Mar 1 2012",
            "timestamp": 1330588800,
            "measurements": {
                "pageSpeed": "80",
                "numDomains": "22",
                "kBTransferred": {
                    "total": "794",
                    "html": "54",
                    "js": "229",
                    "css": "41",
                    "img": "368",
                    "flash": "101"
                },
                "numRequests": {
                    "total": "138",
                    "html": "30",
                    "js": "13",
                    "css": "2",
                    "img": "76",
                    "flash": "4"
                }
            }
        }]
    }
})
</pre>

<?php echo uiFooter() ?>

</body>
</html>
