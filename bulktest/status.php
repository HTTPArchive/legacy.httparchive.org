<?php
include './settings.inc';

$results = array();

// see if there is an existing test we are working with
if( LoadResults($results) )
{
    // count the number of tests that don't have status yet
    $testCount = 0;
    foreach( $results as &$result )
        if( strlen($result['id']) && !strlen($result['result']) )
            $testCount++;
            
    if( $testCount )
    {
        echo "Updating the status for $testCount tests...\r\n";
        
        UpdateResults($results, $testCount);
        
        // store the results
        StoreResults($results);
        
        // go through and provide a summary of the results
        $testCount = count($results);
        $failedSubmit = 0;
        $complete = 0;
        $stillTesting = 0;
        $failed = 0;
        foreach( $results as &$result )
        {
            if( strlen($result['id']) )
            {
                if( strlen($result['result']) )
                {
                    $complete++;
                    if( $result['result'] != 0 && $result['result'] != 99999 )
                        $failed++;
                }
                else
                    $stillTesting++;
            }
            else
                $failedSubmit++;
        }
        
        echo "Update complete (and the results are in results.txt):\r\n";
        echo "\t$testCount tests in total (each url across all locations)\r\n";
        echo "\t$complete tests have completed\r\n";
        if( $failedSubmit )
            echo "\t$failedSubmit were not submitted successfully and need to be re-submitted\r\n";
        if( $stillTesting )
            echo "\t$stillTesting are still waiting to be tested\r\n";
        if( $failed )
            echo "\t$failed returned an error while testing (page timeot, test error, etc)\r\n";
    }
    else
        echo "All tests have results available\r\n";
}
else
    echo "No tests found in results.txt\r\n";  

/**
* Go through and update the status of all of the tests
* 
* @param mixed $results
*/
function UpdateResults(&$results, $testCount)
{
    global $server;

    $count = 0;
    foreach( $results as &$result )
    {
        if( strlen($result['id']) && !strlen($result['result']) )
        {
            $count++;
            echo "\rUpdating the status of test $count of $testCount...                  ";

            $doc = new DOMDocument();
            if( $doc )
            {
                $response = file_get_contents("{$server}xmlResult/{$result['id']}/");
                if( strlen($response) )
                {
                    $doc->loadXML($response);
                    $nodes = $doc->getElementsByTagName('statusCode');
                    $status = trim($nodes->item(0)->nodeValue);
                    
                    if( $status == 200 )
                    {
                        // test is complete, get the actual result
                        GetTestResult($doc, $result);
                    }

                    unset( $doc );
                }
            }
        }
    }

    // clear the progress text
    echo "\r                                                     \r";
}

/**
* Parse the results for the given test
* 
* @param mixed $result
*/
function GetTestResult($doc, &$result)
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
?>
