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

require_once("crawl_lib.inc");
require_once("bootstrap.inc");

function killProcessAndChildren($pid, $signal=9) { 
	exec("ps -ef | awk '\$3 == '$pid' { print  \$2 }'", $output, $ret); 
	if ( $ret ) 
		return 'you need ps, grep, and awk'; 
	while ( list(, $t) = each($output) ) { 
		if ( $t != $pid ) { 
			killProcessAndChilds($t,$signal); 
		} 
	} 
        posix_kill($pid, $signal); 
}


function getPid($text) {
	exec("ps -ef | grep '$text' | grep -v 'grep $text' | awk '{ print \$2 }'", $output, $ret);
	if ( $ret )
		return -1;
	else
		if ( count($output) )
			return $output[0];
		else
			return 0;
}


// Start a new batch
$pid = getPid("php crawl.php");
if ( -1 != $pid ) {
	if ( 0 < $pid ) {
		killProcessAndChildren($pid);
	}
	emptyStatusTable();
}
?>
