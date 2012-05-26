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
require_once("../utils.inc");

set_time_limit(0);

$gArchive = "All";
$gMarks = array();
$gAggTimes = array();
$gAggCounts = array();
$ghReqOtherHeaders = array();
$ghRespOtherHeaders = array();

// global options
$video = true;
$private = false;
$docComplete = true;
$fvonly = true;
$runs = 3;
$mv = 1;  // only save video for Median run
$wptApiKey = '';
@include_once('wptkey.inc.php');

// list of locations to use
$locations = array();
$locations[] = ( $gbMobile ? 'iphone43' : 'IE8' );
