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

require_once("utils.inc");
require_once("dbapi.inc");

////////////////////////////////////////////////////////////////////////////////
//
// STATUS - the table used by bulktest
//
////////////////////////////////////////////////////////////////////////////////

function addStatusData($url, $loc, $label, $rank=NULL) {
	global $gStatusTable, $gArchive;
	$now = time();
	$cmd = "REPLACE INTO $gStatusTable SET url = '" . mysql_real_escape_string($url) . 
		"' , location = '" . mysql_real_escape_string($loc) . 
		"', archive = '$gArchive', label = '$label'" . 
		( $rank ? ", rank = $rank" : "" ) .
		", status = '" . NOT_STARTED . "', timeofLastChange = '$now';";
	doSimpleCommand($cmd);
}


function removeAllStatusData() {
	global $gStatusTable;
	$cmd = "TRUNCATE TABLE $gStatusTable;";
	doSimpleCommand($cmd);
}


// return the label for the current crawl in the status table (there should be only one)
function statusLabel() {
	global $gStatusTable;
	return doSimpleQuery("select distinct(label) from $gStatusTable;");  // there should only be one
}


// return the number of errors
function statusErrors() {
	global $gStatusTable, $gErrBase;
	return doSimpleQuery("select count(*) from $gStatusTable where status >= $gErrBase;");
}

?>
