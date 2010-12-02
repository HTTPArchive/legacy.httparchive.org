<?php
include './settings.inc';

$gArchive = "All";
$gLabel = $argv[1];
if ( !$gLabel ) {
	echo "You must specify a label.\n";
	exit();
}
$results = array();

// see if there is an existing test we are working with
if( LoadResults($results) )
{
    // count the number of tests that don't have status yet
    $testCount = 0;
    foreach( $results as &$result )
        if( strlen($result['id']) && strlen($result['result']) && $result['medianRun'] )
            $testCount++;
            
    if( $testCount )
    {
        echo "Retrieving HAR files for $testCount tests...\r\n";
        
        $dir = "./archives/$gArchive/$gLabel";
        if( !is_dir("$dir") ) {
            mkdir("$dir");
		}

        $count = 0;
        foreach( $results as &$result )
        {
            if( strlen($result['id']) && strlen($result['result']) && $result['medianRun'] )
            {
                $count++;
                echo "\rRetrieving HAR for test $count of $testCount...                  ";

                $file = BuildFileName($result['url']);
				$fullpath = "./archives/$gArchive/$gLabel/$file.har";
                if( strlen($file) && !is_file("$fullpath") ) {
                    $response = file_get_contents("{$server}export.php?test={$result['id']}&run={$result['medianRun']}&cached=0");
                    if( strlen($response) )
                        file_put_contents("$fullpath", $response);
                }
				else {
					echo "skipping $file.har - already exists\n";
				}
            }
        }

        // clear the progress text
        echo "\r                                                     \r";
        echo "Done\r\n";
    }
    else
        echo "No HAR files available for download\r\n";
}
else
    echo "No tests found in results.txt\r\n";  

/**
* Create a file name given an url
* 
* @param mixed $results
*/
function BuildFileName($url)
{
    $file = trim($url, "\r\n\t \\/");
    $file = str_ireplace('http://', '', $file);
    $file = str_ireplace(':', '_', $file);
    $file = str_ireplace('/', '_', $file);
    $file = str_ireplace('\\', '_', $file);
    $file = str_ireplace('%', '_', $file);
    
    return $file;
}
