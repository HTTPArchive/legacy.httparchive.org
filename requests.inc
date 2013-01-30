<?php

require_once("utils.inc");
require_once("dbapi.inc");


// $aResources is the 'entries' property from a HAR file:
//   log->entries
function resourcesFromHar($aHarResources, $pageref=null) {
	global $ghReqHeaders, $ghRespHeaders;

	// HAR (JSON) is heirarchical. MySQL is flat. 
	// We have to flatten the HAR object into a hash.
	// This code is brittle.
	$aResources = array();  // I found I had to return a NEW array
	foreach($aHarResources as $resource) {
		if ( $pageref && $pageref != $resource['pageref'] ) {
			// In some cases the HAR file may contain MULTIPLE pages in which case
			// the $pageRef parameter identifies the resources we want.
			continue;
		}

		// copy things up to the top
		$req = $resource['request'];
		$resource['method'] = $req['method'];
		$resource['reqHttpVersion'] = $req['httpVersion'];
		$resource['url'] = $req['url'];
		if ( array_key_exists('headersSize', $req) && 0 < $req['headersSize'] ) $resource['reqHeaderSize'] = $req['headersSize'];
		if ( array_key_exists('bodySize', $req) && 0 < $req['bodySize'] ) $resource['reqBodySize'] = $req['bodySize'];
		flattenHeaders($resource, $req['headers'], "req", $ghReqHeaders);
					   
		$resp = $resource['response'];
		$resource['status'] = $resp['status'];
		$resource['respHttpVersion'] = $resp['httpVersion'];
		if ( array_key_exists('url', $resp) ) $resource['redirectUrl'] = $resp['url'];
		if ( array_key_exists('headersSize', $resp) && 0 < $resp['headersSize'] ) $resource['respHeaderSize'] = $resp['headersSize'];
		if ( array_key_exists('bodySize', $resp) && 0 < $resp['bodySize'] ) $resource['respBodySize'] = $resp['bodySize'];
		$content = $resp['content'];
		$resource['respSize'] = $content['size'];
		$resource['mimeType'] = $content['mimeType'];
		flattenHeaders($resource, $resp['headers'], "resp", $ghRespHeaders);
		array_push($aResources, $resource);
	}
					   
	return $aResources;
}


// The HAR file has request & response headers, some of which have the same name.
// To put them in a single hash (assoc array) we have to use different names.
// Plus we like to change the names a bit, and remove/merge other headers.
//   $resource is the main hash where we're putting the flattened headers
//   $aHeaders is the 'headers' property from the HAR file
//   $prefix is either "req" or "resp" and is used to prefix the CookieLen and OtherHeaders keys
function flattenHeaders(&$resource, $aHeaders, $prefix, $mapping) {
	foreach($aHeaders as $header) {
		$name = $header['name'];
		$lcname = strtolower($name); // normalize camel case in header names
		$value = $header['value'];

		if ( array_key_exists($lcname, $mapping) ) {
			// This is one of the standard headers we want to save.
			$flatname = $mapping[$lcname];
			$resource[$flatname] = ( array_key_exists($flatname, $resource) ? $resource[$flatname] . " " : "" ) . $value; // append if already exists
			// TODO - these are going to generate a warning if they exceed the DB column size
		}
		else if ( "cookie" == $lcname || "set-cookie" == $lcname ) {
			// We don't save the cookie headers, just the size.
			$key = $prefix . "CookieLen";
			$resource[$key] = ( array_key_exists($key, $resource) ? $resource[$key] : 0 ) + strlen($value); // increment if already exists
		}
		else {
			// All other headers are lumped together.
			$key = $prefix . "OtherHeaders";
			$resource[$key] = ( array_key_exists($key, $resource) ? $resource[$key] . ", " : "" ) . "$name = $value"; // append if already exists
		}
	}
}


// Return TRUE or FALSE indicating if the page's resources are in the requests table.
function resourcesAvailableFromTable($pageid) {
	global $gRequestsTable;
	$num = doSimpleQuery("select count(*) from $gRequestsTable where pageid = '$pageid';");
	return $num;
}

// We should NOT be accessing the requests table from the production website.
function getRequestsFromTableDEPRECATED($pageid) {
	global $gRequestsTable;

	$query = "select * from $gRequestsTable where pageid = '$pageid';";
	$result = doQuery($query);
	$aReqs = array();
	if ( $result ) {
		while ( $req = mysql_fetch_assoc($result) ) {
			array_push($aReqs, $req);
		}
	}
	mysql_free_result($result);

	return $aReqs;
}


?>
