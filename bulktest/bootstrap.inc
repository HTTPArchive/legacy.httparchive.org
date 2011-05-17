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

require_once("../settings.inc");

set_time_limit(0);

$gArchive = "All";
$gMarks = array();
$gAggTimes = array();
$gAggCounts = array();
$ghReqOtherHeaders = array();
$ghRespOtherHeaders = array();

// The status table saves $gErrBase + i to indicate that there is a permanent error happens when the test is in the status i.
$gErrBase = 400;

// The file used as a file lock to coordinate the interaction of processes.
$gLockFile = '/tmp/httparchive_batch_lock.txt';

// global options
$video = true;
$private = false;
$docComplete = true;
$fvonly = true;
$server = 'http://httparchive.webpagetest.org/';
$runs = 3;
$mv = 1;
$wptApiKey = '';
@include_once('wptkey.inc.php');

// list of locations to use
$locations = array();
$locations[] = 'Dulles_IE8';


