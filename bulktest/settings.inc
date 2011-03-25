<?php
set_time_limit(0);

// global options
$video = true;
$private = false;
$docComplete = true;
$runs = 3;
$fvonly = true;
$mv = true; // only store median video
$server = 'http://httparchive.webpagetest.org/';  // also in ../settings.inc

// list of locations to use
$locations = array();
//$locations[] = 'Dulles_IE7';
$locations[] = 'Dulles_IE8';
//$locations[] = 'EC2_Dulles_IE8';
//$locations[] = 'NewYork_IE8';
//$locations[] = 'Chicago_IE7';
//$locations[] = 'SanJose';
//$locations[] = 'China';
//$locations[] = 'NZ';
//$locations[] = 'UK';
//$locations[] = 'Paris_IE7';
//$locations[] = 'Amsterdam';
//$locations[] = 'Frankfurt';

/**
* shared function to load the results file
* 
* @param mixed $results
*/
function LoadResults(&$results)
{
    $ret = false;

    if( is_file('./results.txt') )
    {
        $lines = file('./results.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach( $lines as $lineNum => $line )
        {
            // skip the header row
            if( $lineNum )
            {
                $parts = explode("\t", $line);
                if( count($parts) )
                {
                    $results[] = array( 'url' => trim($parts[0]), 
                                        'location' => trim($parts[1]), 
                                        'id' => trim($parts[2]), 
                                        'result' => trim($parts[3]),
                                        'medianRun' => trim($parts[4]),
                                        'loadTime' => trim($parts[5]),
                                        'startRender' => trim($parts[6]),
										'PageSpeedScore' => trim($parts[10]) );
                    $ret = true;
                }
            }
        }
    }
    
    return $ret;
}  

/**
* shared function to write out the results file
*/
function StoreResults(&$results)
{
    global $server;
    
    $file = fopen('./results.txt', 'w');
    if( $file )
    {
        // write out the header row
        fwrite($file, "URL\tLocation\tTest ID\tTest Result\tMedian Run\tLoad Time\tStart Render Time\tTest Results URL\tMedian Results URL\tFilmstrip URL\tPageSpeedScore\r\n");
        foreach( $results as &$result )
        {
            $line = "{$result['url']}\t{$result['location']}\t{$result['id']}\t{$result['result']}";
            if( $result['medianRun'] )
            {
                $line .= "\t{$result['medianRun']}\t{$result['loadTime']}\t{$result['startRender']}";
                $line .= "\t{$server}result/{$result['id']}/";
                $line .= "\t{$server}result/{$result['id']}/{$result['medianRun']}/details/";
                $line .= "\t{$server}video/compare.php?tests={$result['id']}-r:{$result['medianRun']}-c:0";
                $line .= "\t{$result['PageSpeedScore']}";
            }
            $line .= "\r\n";
            
            fwrite($file, $line);
        }
            
        fclose($file);
    }
}

?>
