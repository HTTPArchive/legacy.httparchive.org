<?php
/* This file is used to coordinate multiple updates for the schema
   changes in Dec 2012.
*/

require_once("../settings.inc");
require_once("../utils.inc");
require_once("../dbapi.inc");
require_once("../requests.inc");
require_once("../crawls.inc");
require_once("../stats.inc");
require_once("batch_lib.inc");

// Even tho we run this from DEV we want to take action on the production tables.
if ( $gbDev ) {
	$gbDev = false;
	$gRequestsTable = "requests";
	$gPagesTable = "pages";
	$gStatsTable = "stats";
}
$pagesTable = $gPagesTable;
$requestsTable = $gRequestsTable;

$device = curDevice();

$label = null;
if ( array_key_exists(1, $argv) ) {
	$label = $argv[1];
}

if ( ! $label ) {
	tprint("ERROR: you must specify the label, eg, \"Nov 15 2012\".");
	exit();
}

$crawl = getCrawl($label, "All", $device);
if ( FALSE === $crawl ) {
	tprint("ERROR: Crawl \"$label\" for archive \"All\" and location \"$device\" wasn't found.");
}

$minPageid = $crawl['minPageid'];
$maxPageid = $crawl['maxPageid'];
$pageidCond = "pageid >= $minPageid and pageid <= $maxPageid";
tprint("$label: $pageidCond");

echo doSimpleQuery("select count(*) from pages where $pageidCond;") . " = count(*) in pages: " . "\n";
echo doSimpleQuery("select count(*) from pages where $pageidCond and maxDomainReqs != 0;") . " = count(*) in pages with maxDomainReqs != 0: " . "\n";
echo doSimpleQuery("select count(*) from pagestmp where $pageidCond;") . " = count(*) in pagestmp: " . "\n";
echo doSimpleQuery("select count(*) from pagestmp where $pageidCond and maxDomainReqs != 0;") . " = count(*) in pagestmp with maxDomainReqs != 0: " . "\n";
echo doSimpleQuery("select count(*) from pagesdev where $pageidCond;") . " = count(*) in pagesdev: " . "\n";
echo doSimpleQuery("select count(*) from pagesdev where $pageidCond and maxDomainReqs != 0;") . " = count(*) in pagesdev with maxDomainReqs != 0: " . "\n";


// 1. RESTORE DUMP FILE?
tprint("\n1. Checking if dumpfile needs to be restored...");
$bRedirectUrlShort = doSimpleQuery("show columns from $requestsTable like '%redirectUrlShort%';");
if ( ! resourcesAvailableFromTable($minPageid) || ! resourcesAvailableFromTable($maxPageid) ) {
	$dumpfile = "httparchive_" . str_replace(" ", "_", $label) . ".gz";
	tprint("Ugh! We need to restore dumpfile $dumpfile.");
	if ( ! $bRedirectUrlShort ) {
		tprint("ERROR: You have to add the redirectUrlShort column before restoring a dump file.\n" .
			   "  alter table $requestsTable add column redirectUrlShort varchar (255) after redirectUrl;");
		exit();
	}
	if ( ! file_exists( $dumpfile ) ) {
		$dumpUrl = "http://www.archive.org/download/httparchive_downloads/$dumpfile";
		tprint("Downloading dump file $dumpUrl...");
		exec("wget $dumpUrl");
		tprint("...done downloading.");
	}
	if ( ! file_exists( $dumpfile ) ) {
		tprint("ERROR: download failed.");
		exit();
	}
	tprint("Restoring dump file \"$dumpfile\"...");
	$cmd = "gunzip -c $dumpfile | mysql -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb";
	exec($cmd);
	tprint("...done restoring dump file.");
	if ( ! resourcesAvailableFromTable($minPageid) || ! resourcesAvailableFromTable($maxPageid) ) {
		tprint("ERROR: after dump requests are STILL missing.");
		exit();
	}
	tprint("Requests were restored successfully.");
	exec("unlink $dumpfile");
	tprint("Deleted $dumpfile.");
}
else {
	tprint("...don't need to restore dumpfile - requests exist in $requestsTable table.");
}



// 2. REMOVE ORPHANED REQUESTS
tprint("\n2. Checking for orphaned records...");
$ppages = doSimpleQuery("select count(distinct(pageid)) from $pagesTable where $pageidCond;");
$rpages = doSimpleQuery("select count(distinct(pageid)) from $requestsTable where $pageidCond;");
if ( $ppages < $rpages ) {
	$delta = $rpages - $ppages;
	tprint("There are $delta orphaned records. Run the following command:\n" .
		   "    delete from $requestsTable where $pageidCond and pageid not in (select pageid from $pagesTable where $pageidCond);\n" .
		   "aborting");
	exit();
}
tprint("...no orphaned records.");



// 3. Calculate requests' expAge
tprint("\n3. Checking if expAge needs calculating...");
$numExpage = doSimpleQuery("select count(*) from $requestsTable where $pageidCond and expAge != 0;");
if ( $numExpage < ($maxPageid - $minPageid) * 20 ) {
	tprint("Only $numExpage record(s) have expAge calculated so we're going to recalculate for all of them.");
	$query = "select requestid, resp_cache_control, resp_expires, startedDateTime from $requestsTable where $pageidCond and expAge=0 and (resp_cache_control like '%max-age=%' or resp_expires is not null);";
	tprint("  doing query: $query");
	$result = doQuery($query);
	tprint("  done with query");
	$iExpage = 0;
	while ($row = mysql_fetch_assoc($result)) {
		$iExpage++;
		$requestid = $row['requestid'];
		$cc = $row['resp_cache_control'];
		$exp = $row['resp_expires'];
		$startedDateTime = $row['startedDateTime'];

		$expAge = 0;
		if ( $cc  && FALSE !== stripos($cc, "must-revalidate") && FALSE !== stripos($cc, "no-cache") && FALSE !== stripos($cc, "no-store") ) {
			// These directives dictate the response can NOT be cached.
			$expAge = 0;
		}
		else if ( $cc  && FALSE !== ($posMaxage = stripos($cc, "max-age=")) ) {
			$expAge = intval(substr($cc, $posMaxage+8));
		}
		else if ( $exp ) {
			// minimal validation on the Expires header
			$exp3 = strtolower(substr($exp, 0, 3));
			if ( "sun" === $exp3 || "mon" === $exp3 || "tue" === $exp3 || "wed" === $exp3 || "thu" === $exp3 || "fri" === $exp3 || "sat" === $exp3 ) {
				$expAge = strtotime($exp) - $startedDateTime;
			}
		}
		if ( $expAge < 0 ) { $expAge = 0; }

		if ( $expAge ) {
			$cmd = "update $requestsTable set expAge = $expAge where requestid = $requestid;";
			doSimpleCommand($cmd);
		}

		if ( 0 === ($iExpage % 100000) ) {
			tprint("    finished " . ($iExpage/1000) . "K");
		}
	}
	mysql_free_result($result);
}
tprint("...done checking expAge.");


// 4. Update new fields in pages (based on requests & WPT HAR).
$tmpPageid = doSimpleQuery("select max(pageid) from pagestmp where $pageidCond;"); // find pages we've already migrated to pagestmp
$query = "select count(*) from $pagesTable where $pageidCond" . ( $tmpPageid ? " and pageid > $tmpPageid" : "" ) . " and maxDomainReqs = 0;";
$numPages = doSimpleQuery($query);
tprint("\n4. Update $numPages pages...");
$query = "select * from $pagesTable where $pageidCond" . ( $tmpPageid ? " and pageid > $tmpPageid" : "" ) . " and maxDomainReqs = 0;";
$result = doQuery($query);
$iPages = 0;
// use one link to make it faster?
while ($row = mysql_fetch_assoc($result)) {
	importPageMod($row);
	$iPages++;
	if ( 0 === ( $iPages % 1000 ) ) {
		tprint("    finished " . ($iPages/1000) . "K");
	}
}
tprint("...done updating new pages fields.");

if ( $iPages > 0 && ! $gbMobile ) { // no pagestmp table for mobile
	tprint("Copy rows from pagestmp to pages.");
	$row = doRowQuery("select min(pageid) as minid, max(pageid) as maxid from pagestmp where $pageidCond and maxDomainReqs != 0;");
	$minid = $row['minid'];
	$maxid = $row['maxid'];
	$maxidFixed = doSimpleQuery("select max(pageid) from $pagesTable where $pageidCond and maxDomainReqs != 0;");
	if ( $maxidFixed ) {
		$maxidFixed++; // we want to copy over the page AFTER the last fixed page
		$minid = max($row['minid'], $maxidFixed); // don't copy over rows that have already been copied over or fixed
	}
	if ( $minid === $maxid ) {
		tprint("The rows have already been copied.");
	}
	else {
		$cmd = "replace into $pagesTable select * from pagestmp where pageid >= $minid and pageid <= $maxid and maxDomainReqs != 0;";
		tprint("Replacing " . ( $maxid - $minid ) . " rows from pagestmp to $pagesTable:\n  $cmd");
		doSimpleCommand($cmd);
		tprint("...done copying rows.");
	}
}



// 5. Recalculate stats
tprint("\n5. Recalculate stats...");
// TODO - This script doesn't detect & skip this step if it's already been done, but it's very fast (20 seconds) so we won't worry.
// TODO - could test for bytesFont or perFonts
tprint("Update numPages and numRequests in crawls:");
// It's possible that while removing orphans and pages with wptid="" some meta-crawl information has changed:
$row = doRowQuery("select count(*) as numPages, min(pageid) as minPageid, max(pageid) as maxPageid from $pagesTable where $pageidCond;");
$numRequests = doSimpleQuery("select count(*) from $requestsTable where $pageidCond;");
doSimpleCommand("update $gCrawlsTable set numPages = " . $row['numPages'] . ", minPageid = " . $row['minPageid'] . 
				", maxPageid = " . $row['maxPageid'] . ", numRequests = $numRequests where label = '$label' and location='$device';");
tprint("Compute stats:");
removeStats($label, NULL, $device);
computeMissingStats($device, true);
tprint("...done recalculating stats.");



// 6. Mysqldump
tprint("\n6. Mysqldump & wrap up...");
$col = doSimpleQuery("show columns from $requestsTable like '%redirectUrlShort%';");
if ( $col ) {
	tprint("You have to remove the redirectUrlShort column before we can do the dumps:\n" .
		   "    alter table $requestsTable drop column redirectUrlShort;");
	tprint("almost done!");
}
else {
	$labelUnderscore = str_replace(" ", "_", $label);
	$tmpdir = "/tmp/$labelUnderscore." . time();  // Unique dir for this dump cuz mysqldump writes files that aren't writable by this process, and mysqldump -T can NOT overwrite existing files.
	// pages
	$cmd = "mysqldump --where='pageid >= $minPageid and pageid <= $maxPageid' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $pagesTable | gzip > ../downloads/httparchive_" . ( $gbMobile ? "mobile_" : "" ) . $labelUnderscore . "_pages.gz";
	tprint("Dump pages table:");
	exec($cmd);
	// pages csv
	$cmd = "mkdir $tmpdir; chmod 777 $tmpdir; " .
		"mysqldump --where='pageid >= $minPageid and pageid <= $maxPageid' -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer -T $tmpdir --fields-enclosed-by=\\\" --fields-terminated-by=, $gMysqlDb $pagesTable; " .
		"gzip -f -c $tmpdir/$pagesTable.txt > ../downloads/httparchive_" . ( $gbMobile ? "mobile_" : "" ) . $labelUnderscore . "_pages.csv.gz";
	tprint("Dump pages table CSV:");
	exec($cmd);
	// requests
	$cmd = "mysqldump --where='pageid >= $minPageid and pageid <= $maxPageid' --no-create-db --no-create-info --skip-add-drop-table --complete-insert -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer $gMysqlDb $requestsTable | gzip > ../downloads/httparchive_" . ( $gbMobile ? "mobile_" : "" ) . $labelUnderscore . "_requests.gz";
	tprint("Dump requests table:");
	exec($cmd);
	// requests csv
	$cmd = "mysqldump --where='pageid >= $minPageid and pageid <= $maxPageid' -u $gMysqlUsername -p$gMysqlPassword -h $gMysqlServer -T $tmpdir --fields-enclosed-by=\\\" --fields-terminated-by=, $gMysqlDb $requestsTable; " .
		"gzip -f -c $tmpdir/$requestsTable.txt > ../downloads/httparchive_" . ( $gbMobile ? "mobile_" : "" ) . $labelUnderscore . "_requests.csv.gz";
	tprint("Dump requests table CSV:");
	exec($cmd);
	tprint("Dumps are done.");

	if ( ! $gbMobile ) {
		// Only save the requests records for recent crawls.
		//tprint("Insert records from requests to requestsdev:");
		//$insertcmd = "replace into requestsdev select * from $requestsTable where $pageidCond;";
		//doSimpleCommand($insertcmd);
		$delcmd = "delete from $requestsTable where $pageidCond;";
		//tprint("Delete records from requests:");
		//doSimpleCommand($delcmd);
		tprint("You might want to move or delete the requests rows:\n    $delcmd");
	}
	tprint("DONE!");
}

exit();





// shortened version from batch_lib.inc
// $hPage is the $row from mysql for this page - IT HAS ALL THE CURRENT FIELD VALUES! We're just adding to those here.
function importPageMod($hPage) {
	global $pagesTable, $requestsTable;
	$t_CVSNO = time();

	$pageid = $hPage['pageid'];
	$wptid = $hPage['wptid'];
	$wptrun = $hPage['wptrun'];
	if ( ! $wptid || ! $wptrun ) {
		tprint("ERROR: importPageMod($pageid): failed to find wptid and wptrun: $wptid, $wptrun");
		return;
	}

	// lifted from importWptResults
	$wptServer = wptServer();
	$request = $wptServer . "export.php?test=$wptid&run=$wptrun&cached=0&php=1";
	$response = fetchUrl($request);
	//tprint("after fetchUrl", $t_CVSNO);
	if ( ! strlen($response) ) {
		tprint("ERROR: importPageMod($pageid): URL failed: $request");
		return;
	}

	// lifted from importHarJson
	$json_text = $response;
	$HAR = json_decode($json_text);
	if ( NULL == $HAR ) {
		tprint("ERROR: importPageMod($pageid): JSON decode failed");
		return;
	}
	$log = $HAR->{ 'log' };
	$pages = $log->{ 'pages' };
	$pagecount = count($pages);
	if ( 0 == $pagecount ) {
		tprint("ERROR: importPageMod($pageid): No pages found");
		return;
	}


	// lifted from importPage
	$page = $pages[0];
	if ( array_key_exists('_TTFB', $page) ) { $hPage['TTFB'] = $page->{'_TTFB'}; }
	if ( array_key_exists('_fullyLoaded', $page) ) { $hPage['fullyLoaded'] = $page->{'_fullyLoaded'}; }
	if ( array_key_exists('_visualComplete', $page) ) { $hPage['visualComplete'] = $page->{'_visualComplete'}; }
	if ( array_key_exists('_gzip_total', $page) ) {
		$hPage['gzipTotal'] = $page->{'_gzip_total'};
		$hPage['gzipSavings'] = $page->{'_gzip_savings'};
	}
	if ( array_key_exists('_domElements', $page) ) { $hPage['numDomElements'] = $page->{'_domElements'}; }
	if ( array_key_exists('_domContentLoadedEventStart', $page) ) { $hPage['onContentLoaded'] = $page->{'_domContentLoadedEventStart'}; }
	if ( array_key_exists('_base_page_cdn', $page) ) { $hPage['cdn'] = $page->{'_base_page_cdn'}; }
	if ( array_key_exists('_SpeedIndex', $page) ) { $hPage['SpeedIndex'] = $page->{'_SpeedIndex'}; }

	// lifted from aggregateStats
	// initialize variables for counting the page's stats
	$hPage['bytesTotal'] = 0;
	$hPage['reqTotal'] = 0;
	$typeMap = array( "flash" => "Flash", "css" => "CSS", "image" => "Img", "script" => "JS", "html" => "Html", 
					  "font" => "Font", "other" => "Other", "gif" => "Gif", "jpg" => "Jpg", "png" => "Png" );
	foreach( array_keys($typeMap) as $type) {
		// initialize the hashes
		$hPage['req' . $typeMap[$type]] = 0;
		$hPage['bytes' . $typeMap[$type]] = 0;
	}
	$hDomains = array();
	$hPage['maxageNull'] = $hPage['maxage0'] = $hPage['maxage1'] = $hPage['maxage30'] = $hPage['maxage365'] = $hPage['maxageMore'] = 0;
	$hPage['bytesHtmlDoc'] = $hPage['numRedirects'] = $hPage['numErrors'] = $hPage['numGlibs'] = $hPage['numHttps'] = $hPage['numCompressed'] = $hPage['maxDomainReqs'] = 0;

	$result = doQuery("select mimeType, urlShort, resp_content_type, respSize, expAge, firstHtml, status, resp_content_encoding, req_host from $requestsTable where pageid = $pageid;");
	//tprint("after query", $t_CVSNO);
	while ($row = mysql_fetch_assoc($result)) {
		$reqUrl = $row['urlShort'];
		$mimeType = prettyMimetype($row['mimeType'], $reqUrl);
		$respSize = intval($row['respSize']);
		$hPage['reqTotal']++;
		$hPage['bytesTotal'] += $respSize;
		$hPage['req' . $typeMap[$mimeType]]++;
		$hPage['bytes' . $typeMap[$mimeType]] += $respSize;

		if ( "image" === $mimeType ) {
			$content_type = $row['resp_content_type'];
			$imgformat = ( false !== stripos($content_type, "image/gif") ? "gif" : 
						   ( false !== stripos($content_type, "image/jpg") || false !== stripos($content_type, "image/jpeg") ? "jpg" : 
							 ( false !== stripos($content_type, "image/png") ? "png" : "" ) ) );
			if ( $imgformat ) {
				$hPage['req' . $typeMap[$imgformat]]++;
				$hPage['bytes' . $typeMap[$imgformat]] += $respSize;
			}
		}

		// count unique domains (really hostnames)
		$aMatches = array();
		if ( $reqUrl && preg_match('/http[s]*:\/\/([^\/]*)/', $reqUrl, $aMatches) ) {
			$hostname = $aMatches[1];
			if ( ! array_key_exists($hostname, $hDomains) ) {
				$hDomains[$hostname] = 0;
			}
			$hDomains[$hostname]++; // count hostnames
		}
		else {
			tprint("ERROR: importPageMod($pageid): No hostname found in URL: $reqUrl");
		}

		// count expiration windows
		$expAge = $row['expAge'];
		$daySecs = 24*60*60;
		if ( NULL === $expAge ) { $hPage['maxageNull']++; }
		else if ( 0 === intval($expAge) ) { $hPage['maxage0']++; }
		else if ( $expAge <= (1 * $daySecs) ) { $hPage['maxage1']++; }
		else if ( $expAge <= (30 * $daySecs) ) { $hPage['maxage30']++; }
		else if ( $expAge <= (365 * $daySecs) ) { $hPage['maxage365']++; }
		else { $hPage['maxageMore']++; }

		if ( $row['firstHtml'] ) { $hPage['bytesHtmlDoc'] = $respSize; } // CVSNO - can we get this UNgzipped?!

		$status = $row['status'];
		if ( 300 <= $status && $status < 400 && 304 != $status ) { $hPage['numRedirects']++; }
		else if ( 400 <= $status && $status < 600 ) { $hPage['numErrors']++; }

		if ( 0 === stripos($reqUrl, "https://") ) { $hPage['numHttps']++; }

		if ( FALSE !== stripos($row['req_host'], "googleapis.com") ) { $hPage['numGlibs']++; }

		if ( "gzip" == $row['resp_content_encoding'] || "deflate" == $row['resp_content_encoding'] ) { $hPage['numCompressed']++; }
	}
	mysql_free_result($result);
	$hPage['numDomains'] = count(array_keys($hDomains));
	foreach (array_keys($hDomains) as $domain) {
		$hPage['maxDomainReqs'] = max($hPage['maxDomainReqs'], $hDomains[$domain]);
	}

	//$cmd = "UPDATE $pagesTable SET reqTotal = $reqTotal, bytesTotal = $bytesTotal" .
	$cmd = "insert into pagestmp SET " . 
		hashImplode(", ", "=", $hPage) .
		";";
	//tprint("before insert", $t_CVSNO);
	doSimpleCommand($cmd);
	//tprint("after insert\n", $t_CVSNO);
}


?>
