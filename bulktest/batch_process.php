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

require_once("../utils.php");
require_once("batch_lib.inc");
require_once("bootstrap.inc");


// A file lock to guarantee there is only one instance running.
$fp = fopen($gLockFile, "w+");
if ( !flock($fp, LOCK_EX | LOCK_NB) ) {
	echo "There is one instance running already!\r\n";
	reportSummary();
	exit(-1);
}

if ( ! tableExists($gStatusTable) ) {
	echo "Please run batch_start to kick off a new batch!";
	exit(-2);
}


$pid_arr = array();
for ( $i = 0; $i < 4; $i++ ) {
	$pid = pcntl_fork();
	if ( -1 == $pid ) {
		die("cannot fork subprocesses ...");
	} else {
		if ( $pid ) {
			// Parent process
			$pid_arr[] = $pid;
		} elseif ( 0 == $i ) {
			submitBatch();
			exit();
		} elseif ( 1 == $i ) {
			// Check the test status with WPT server
			checkWPTStatus();
			exit();
		} elseif ( 2 == $i ) {
			// Obtain XML result
			obtainXMLResult();
			exit();
		} elseif ( 3 == $i ) {
			// Fill page table and request table
			fillTables();
			exit();
		}
	}
}

// Loop through the processes until all of them are done and then exit.
while ( count($pid_arr) > 0 ) {
	$myId = pcntl_waitpid(-1, $status, WNOHANG);
	foreach ( $pid_arr as $key => $pid ) {
		if ( $myId == $pid ) {
			unset($pid_arr[$key]);
		}
	}
	usleep(100);
}

reportSummary();

?>
