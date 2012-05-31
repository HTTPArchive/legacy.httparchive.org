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


// Compute stats
require_once("../stats.inc");
require_once("../dbapi.inc");
$device = ( $gbMobile ? "iphone" : "IE8" );

echo "Computing stats...\n";

computeMissingStats($device, true);

if ( ! $gbMobile ) {
	echo "Copy stats to production...\n";
	$cmd = "replace into $gStatsTableDesktop select * from $gStatsTableDev where device='IE8';";
	doSimpleCommand($cmd);
}
echo "...stats computed and copied.\n";


// stats mysql dump
$dumpfile = "../downloads/httparchive_stats";
echo "Creating mysqldump file $dumpfile ...\n";
$cmd = "mysqldump --no-create-db --no-create-info --skip-add-drop-table -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $gStatsTableDesktop > $dumpfile";
exec($cmd);
exec("gzip -f $dumpfile");
exec("cp -p $dumpfile.gz ~/httparchive.org/downloads/");
if ( $gbMobile ) {
	exec("cp -p $dumpfile.gz ~/dev.httparchive.org/downloads/");
}
else {
	exec("cp -p $dumpfile.gz ~/mobile.httparchive.org/downloads/");
}
echo "...mysqldump file created and copied: $dumpfile\n";

?>
