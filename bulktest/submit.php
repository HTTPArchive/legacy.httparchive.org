<?php
require_once('./settings.inc');

$results = array();

// see if there is an existing test we are working with
if( LoadResults($results) )
{
    echo "Re-submitting failed tests from current results.txt...\r\n";
}
else
{
    echo "Loading URL list from urls.txt...\r\n";
    $urls = file('./urls.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach( $urls as $url )
    {
        $url = trim($url);
        if( strlen($url) )
        {
            foreach( $locations as $location )
                $results[] = array( 'url' => $url, 'location' => $location );
        }
    }
}

// go through and submit tests for any url where we don't have a test ID or where the test failed
if( count($results) )
{
    // first count the number of tests we are going to have to submit (to give some progress indication)
    $testCount = 0;
    foreach( $results as &$result )
        if( !strlen($result['id']) || (strlen($result['result']) && $result['result'] != 0 && $result['result'] != 99999 ))
            $testCount++;
    
    if( $testCount )
    {
        echo "$testCount tests to submit (combination of URL and Location...\r\n";
        SubmitTests($results, $testCount);
        
        // store the results
        StoreResults($results);
        
        echo "Done submitting tests.  The test ID's are stored in results.txt\r\n";
    }
    else
        echo "No tests to submit, all tests have completed successfully are are still running\r\n";
}
else
    echo "Nothing to do (no urls found)\r\n";

/**
* Submit the actual tests
* 
* @param mixed $results
*/
function SubmitTests(&$results, $testCount)
{
    global $video;
    global $private;
    global $runs;
    global $server;
    global $docComplete;
	global $fvonly;
	global $mv;
	global $wptApiKey;

    $count = 0;
    foreach( $results as &$result )
    {
        if( !strlen($result['id']) || (strlen($result['result']) && $result['result'] != 0 && $result['result'] != 99999 ))
        {
            $count++;
            echo "\rSubmitting test $count of $testCount...                  ";

            $request = $server . 'runtest.php?f=xml&priority=6&url=' . urlencode($result['url']) . "&location={$result['location']}&runs=$runs";
            if( $private )
                $request .= '&private=1';
            if( $video )
                $request .= '&video=1';
            if( $docComplete )
                $request .= '&web10=1';
            if($fvonly)
                $request .= '&fvonly=1';
			if($mv)
				$request .= '&mv=1';
			if(strlen($wptApiKey))
				$request .= "&k=$wptApiKey";

            $doc = new DOMDocument();
            if( $doc )
            {
                $response = file_get_contents($request);
                if( strlen($response) )
                {
                    $doc->loadXML($response);
                    $nodes = $doc->getElementsByTagName('statusCode');
                    $code = (int)trim($nodes->item(0)->nodeValue);
                    if( $code == 200 )
                    {
                        $nodes = $doc->getElementsByTagName('testId');
                        $result['id'] = trim($nodes->item(0)->nodeValue);
                    }
                    else
                    {
                        $nodes = $doc->getElementsByTagName('statusText');
                        $err = trim($nodes->item(0)->nodeValue);
                        echo "\r                                                     ";
                        echo "\rError '$err' submitting {$result['url']} to {$result['location']}\r\n";
                    }
                }
                
                unset( $doc );
            }
        }
    }
    
    // clear the progress text
    echo "\r                                                     \r";
}
?>
