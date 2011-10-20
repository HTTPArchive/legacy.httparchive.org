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

require_once("bootstrap.inc");
require_once("../utils.inc");
require_once("batch_lib.inc");


// A file lock to guarantee there is only one instance running.
$fp = fopen(lockFilename($locations[0], "ALL"), "w+");

if ( !flock($fp, LOCK_EX | LOCK_NB) ) {
	echo "There is one instance running already!\r\n";
	reportSummary();
	exit(-1);
}

if ( ! tableExists($gStatusTable) ) {
	echo "Please run batch_start to kick off a new batch!";
	exit(-2);
}


// Now that we're running as a cronjob, we need to emit nothing to stdout when we're all done.
if ( 0 == totalNotDone() ) {
   exit(0);
}


$aChildPids = array();
for ( $i = 0; $i < 4; $i++ ) {
	// fork the child process
	// return: 
	//   -1 - error
	//    0 - we're the forked child process
	//   >0 - we're the parent process and this is the process ID of the child process
	$pid = pcntl_fork();

	if ( -1 == $pid ) {
		die("cannot fork subprocesses ...");
	} 
	else {
		if ( $pid ) {
			// parent process - save the child process ID
			$aChildPids[] = $pid;
		} 
		else {
			// child process
			if ( 0 == $i ) {
				submitBatch();
				exit();
			} 
			else if ( 1 == $i ) {
				// Check the test status with WPT server
				checkWPTStatus();
				exit();
			} 
			else if ( 2 == $i ) {
				// Obtain XML result
				obtainXMLResult();
				exit();
			} 
			else if ( 3 == $i ) {
				// Fill page table and request table
				fillTables();
				exit();
			}
		}
	}
}


// Loop through the processes until all of them are done and then exit.
while ( count($aChildPids) > 0 ) {
	$myId = pcntl_waitpid(-1, $status, WNOHANG);
	foreach ( $aChildPids as $key => $pid ) {
		if ( $myId == $pid ) {
			unset($aChildPids[$key]);
		}
	}
	usleep(100);
}

reportSummary();

?>
