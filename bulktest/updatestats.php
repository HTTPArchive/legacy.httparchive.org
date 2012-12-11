<?php
// This file is used to update the "stats" table. This is needed when
// new stats are added, or the algorithm changes (in which case you'll
// have to manually delete the old values before calling this script). 
// The way it works is to iterate through ALL the crawls and re-compute
// any stats that are NULL.


require_once("../settings.inc");
require_once("../utils.inc");
require_once("../stats.inc");
require_once("../dbapi.inc");

$device = ( $gbMobile ? "iphone" : "IE8" );

lprint("Computing missing stats...");

computeMissingStats($device, true, true);

lprint("DONE");
?>
