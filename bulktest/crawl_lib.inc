<?php

require_once("../utils.php");

// Load the URLs in urls.txt file into status table.
function LoadUrlFromFile() {
  global $locations, $gArchive, $gLabel;
  $urls = file('./urls.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  if (count($urls) > 0) {
    echo "Checking directory to store HAR files ...\r\n";
    $dir = "./archives/$gArchive/$gLabel";
    if( !is_dir("$dir") ) {
      // recursively create the dir
      mkdir("$dir", 0777, true);
    }
  }

  foreach( $urls as $url ) {
    $url = trim($url);
    if(strlen($url)) {
      foreach ($locations as $location) {
        UpdateStatusTable($url, $location);
      }
    }
  }
}

// Insert a row into the status table.
function UpdateStatusTable($url, $loc) {
  global $gStatusTable, $gArchive, $gLabel;
  $cmd = "REPLACE INTO $gStatusTable SET url = '$url' , location = '$loc', archive = '$gArchive', label = '$gLabel', status = 0, retry = 0, wptid = 'none';";
  //dprint("$cmd");
  doSimpleCommand($cmd);
}

// Obtain the tests with specified status code
function ObtainTestsWithCode($status) {
  global $gStatusTable;
  $query = "SELECT * FROM $gStatusTable WHERE status = $status;";
  return doQuery($query);
}

// Obtain the tests which are not with specified status code
function ObtainTestsWithNotCode($status) {
  global $gStatusTable;
  $query = "SELECT * FROM $gStatusTable WHERE status != $status;";
  return doQuery($query);
}

// Evalute if a query returns emptry result
function IsEmptyQuery($resource) {
  // Deal with the result from doQuery()
  if (NULL != $resource) {
    $num_row = mysql_num_rows($resource);
    if (NULL != $num_row)
      return false;
  }
  return true;
}

// Increment retry col
function IncrementRetry($pageid, $retry) {
  global $gStatusTable;
  $num = $retry + 1;
  $cmd = "UPDATE $gStatusTable SET retry = $num WHERE pageid = $pageid;";
  doSimpleCommand($cmd);
}

// Submit the unfinished tests to WPT
function SubmitTest(&$record) {
  global $gStatusTable;

  global $video;
  global $private;
  global $runs;
  global $server;
  global $docComplete;
  global $fvonly;

  $request = $server . 'runtest.php?f=xml&priority=6&url=' . urlencode($record['url']) . "&location={$record['location']}&runs=$runs";
  if( $private )
    $request .= '&private=1';
  if( $video )
    $request .= '&video=1';
  if( $docComplete )
    $request .= '&web10=1';
  if($fvonly)
    $request .= '&fvonly=1';

  $doc = new DOMDocument();
  if( $doc ) {
    $response = file_get_contents($request);
    if( strlen($response) ) {
      $doc->loadXML($response);
      $nodes = $doc->getElementsByTagName('statusCode');
      $code = (int)trim($nodes->item(0)->nodeValue);
      if( $code == 200 ) {
        // Update status col in status table
        $nodes = $doc->getElementsByTagName('testId');
        $id = trim($nodes->item(0)->nodeValue);
        $cmd = "UPDATE $gStatusTable SET status = 1, wptid = '$id' WHERE pageid = '$record[pageid]';";
        doSimpleCommand($cmd);
      }
    }
    unset( $doc );
  }
}

// Set status code in status table
function SetStatus($pageid, $status) {
  global $gStatusTable;
  $cmd = "UPDATE $gStatusTable SET status = $status WHERE pageid = '$pageid';";
  doSimpleCommand($cmd);
}

// Check if the test is done on WPT server.
function CheckWPTStatus() {
  // Query the status table to get wpt id list
  global $server;
  $result = ObtainTestsWithCode(1);
  if ($result) {
    while ($row = mysql_fetch_assoc($result)) {
      $request = $server . "testStatus.php?f=xml&test=" . $row['wptid'];
      $doc = new DOMDocument();
      if ($doc) {
        $response = file_get_contents($request);
        if (strlen($response)) {
          $doc->loadXML($response);
          $nodes = $doc->getElementsByTagName('statusText');
          $statusTxt = trim($nodes->item(0)->nodeValue);
          echo "{$row['pageid']} $statusTxt\r\n";
          if (!strcmp("Test Complete", $statusTxt)) {
            // Update status code to 2
            SetStatus($row['pageid'], 2);
          }
        }
      }
      unset($doc);
    }
  }
}

// Create a file name given an url
function BuildFileName($url) {
    $file = trim($url, "\r\n\t \\/");
    $file = str_ireplace('http://', '', $file);
    $file = str_ireplace(':', '_', $file);
    $file = str_ireplace('/', '_', $file);
    $file = str_ireplace('\\', '_', $file);
    $file = str_ireplace('%', '_', $file);

    return $file;
}

//
function SaveHarFile(&$pagesInfo) {

}

//
function ObtainXMLResult(&$pagesInfo) {
  global $server;
  $tests = ObtainTestsWithCode(2);
  if (!IsEmptyQuery($tests)) {
    while ($row = mysql_fetch_assoc($tests)) {
      // Fetch the result xml file
      $doc = new DOMDocument();
      if ($doc) {
        $request = $server . "xmlResult/" . $row['wptid'] . "/";
        $response = file_get_contents($request);
        if (strlen($response)) {
          $doc->loadXML($response);
          $nodes = $doc->getElementsByTagName('statusCode');
          $status = trim($nodes->item(0)->nodeValue);
          if (200 == $status) {
            // Import a website
            $result = array();
            ObtainTestResult($doc, $result);
            $pagesInfo[] = $result;
            SetStatus($row['pageid'], 3);
          }
        } else {
          // Error handling for status code 2
        }
      }
    }
  }
}

function ObtainTestResult($doc, &$result)
{
    $runs = $doc->getElementsByTagName('run');

    $times = array();
    $failed = array();

    // pull the stuff we care about out from each run
    foreach( $runs as $run )
    {
        $index = (int)$run->getElementsByTagName('id')->item(0)->nodeValue;
        $fv = $run->getElementsByTagName('firstView');
        if( $fv )
        {
            $testResult = (int)$run->getElementsByTagName('result')->item(0)->nodeValue;
            $loadTime = (int)$run->getElementsByTagName('docTime')->item(0)->nodeValue;
            $render = (int)$run->getElementsByTagName('render')->item(0)->nodeValue;

            if( $loadTime && ($testResult == 0 || $testResult == 99999) )
                $times[$loadTime] = array('index' => $index, 'result' => $testResult, 'loadTime' => $loadTime, 'startRender' => $render);
            else
                $failed[] = array('index' => $index, 'result' => $testResult, 'loadTime' => $loadTime, 'startRender' => $render);
            unset($fv);
        }
    }

    // pull out the results we need
    if( count($times) )
    {
        // find the test with the median load time
        ksort($times);
        $i = (int)floor(count($times) / 2);
        $current = 0;
        foreach( $times as $index => &$data )
        {
            if( $current == $i )
            {
                $result['result'] = $data['result'];
                $result['medianRun'] = $data['index'];
                $result['loadTime'] = $data['loadTime'];
                $result['startRender'] = $data['startRender'];

                break;
            }
            $current++;
        }
    }
    elseif( count($failed) )
    {
        // test failed, grab the first result
        $result['result'] = $failed[0]['result'];
        $result['medianRun'] = $failed[0]['index'];
        $result['loadTime'] = $failed[0]['loadTime'];
        $result['startRender'] = $failed[0]['startRender'];
    }
}

// MAJOR ASSUMPTION: THERE'S ONLY ONE PAGE PER HAR FILE!
// (otherwise, harviewer and har_to_pagespeed won't work)
function ObtainOtherInfo($page) {
	global $gPagesTable;
	global $gArchive, $gLabel;

	$now = time();
	$aTuples = array();
	$pageref = $page->{ 'id' };

	// Add all the insert tuples to an array.
	array_push($aTuples, "createDate = $now");
	array_push($aTuples, "harfile = '$filename'");
	$startedDateTime = strtotime($page->{ 'startedDateTime' });
	array_push($aTuples, "startedDateTime = $startedDateTime");
	array_push($aTuples, "archive = '" . mysqlEscape($gArchive) . "'");
	if ( $gLabel ) {
		array_push($aTuples, "label = '" . mysqlEscape($gLabel) . "'");
	}
	$title = mysqlEscape($page->{ 'title' });
	array_push($aTuples, "title = '$title'");

	$pageTimings = $page->{ 'pageTimings' };
	$renderStart = $pageTimings->{ '_renderStart' };
	if ( $renderStart && 0 < $renderStart ) {
		array_push($aTuples, "renderStart = $renderStart");
	}
	$onContentLoaded = $pageTimings->{ 'onContentLoad' };
	if ( $onContentLoaded && 0 < $onContentLoaded ) {
		array_push($aTuples, "onContentLoaded = $onContentLoaded");
	}
	$onLoad = $pageTimings->{ 'onLoad' };
	if ( $onLoad && 0 < $onLoad ) {
		array_push($aTuples, "onLoad = $onLoad");
	}

	// Page Speed score
	$output = array();
	$return_var = 128;
	exec("../har_to_pagespeed '$filename' 2>/dev/null", $output, $return_var);
	if ( 0 === $return_var ) {
		$totalScore = 0;
		$iScores = 0;
		$matches = array();
		for ( $i = 0; $i < count($output); $i++ ) {
			$line = $output[$i];
			if ( preg_match("/_(.*)_ \(score=([0-9]+)/", $line, $matches) &&
				 false === strpos($line, "Optimize images") ) {
				$totalScore += $matches[2];
				$iScores++;
			}
		}
		$overallScore = round($totalScore/$iScores);
		array_push($aTuples, "PageSpeed = $overallScore");
	}

	$cmd = "replace into $gPagesTable set " . implode(", ", $aTuples) . ";";
	//dprint("$cmd");
	doSimpleCommand($cmd);

	// get the pageid
	$cmd = "select pageid from $gPagesTable where startedDateTime = $startedDateTime and harfile = '$filename';";
	//dprint("$cmd");
	$pageid = doSimpleQuery($cmd);

	return $pageid;
}
?>
