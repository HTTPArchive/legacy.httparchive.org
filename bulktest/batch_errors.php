<?php
set_time_limit(0);
require_once("./batch_lib.inc");
require_once("./bootstrap.inc");

echo "Reporting the test ID and URL for all failed tests...\r\n\r\n";

for( $status = 400; $status <= 404; $status++ )
    reportTests($status);

echo "Done\r\n";

/**
* Report the test ID and URL of each test in the given state
* 
* @param mixed $code
*/
function reportTests($code)
{
    $tests = obtainTestsWithCode($code);
    if ( !IsEmptyQuery($tests) ) 
    {
        echo "Status Code $code:\r\n";
        while ($row = mysql_fetch_assoc($tests)) 
            echo "{$row['wptid']} - {$row['url']}\r\n";
        echo "\r\n\r\n";
    }
}
?>
