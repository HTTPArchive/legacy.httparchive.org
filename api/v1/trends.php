<?php

require_once(dirname(dirname(dirname(__FILE__))) . "/utils.inc");
require_once(dirname(dirname(dirname(__FILE__))) . "/stats.inc");

function process($response) {
	// get the URL params
	// note that we use 'set' instead of 's', but still call it $slice,
	// and use 'date' instead of 'l', but still call it $label
	$archive = 'All';
	$slice = getParam('set', 'All');
	$label = getParam('date', latestLabel($archive));
	$device = getParam('device', 'IE8');
	$url = getParam('url', null);
	$response['callback'] = getParam('callback', null);

	// TODO: validate the URL params; if invalid, return error
	// fetch the stats from DB
	$trends = getTrends($slice, $device, $url);

	// did DB return null?
	//   if so, return error
	//   else, return data
	// TODO should we hit the DB to look for the URL, return 404 in that case?
	if ($trends == false) {
		$response['status'] = 'HTTP/1.1 400 Bad Request';
		$response['body'] = array(
			'error' => array(
				'code' => 400,
				'message' => "No data found. Check your parameters."
			)
		);
	} else {
		$totalData = array();
		foreach ($trends as $d) {
			$curr = array(
				'date' => $d['label'],
				'timestamp' => strtotime($d['label']),
				'measurements' => array(
					'pageSpeed' => $d['PageSpeed'],
					'numDomains' => $d['numDomains'],
					'kBTransferred'=> array(
						'total' => $d['bytesTotal'],
						'html' => $d['bytesHtml'],
						'js' => $d['bytesJS'],
						'css' => $d['bytesCSS'],
						'img' => $d['bytesImg'],
						'flash' => $d['bytesFlash']
					),
					'numRequests'=> array(
						'total' => $d['reqTotal'],
						'html' => $d['reqHtml'],
						'js' => $d['reqJS'],
						'css' => $d['reqCSS'],
						'img' => $d['reqImg'],
						'flash' => $d['reqFlash']
					)
				)
			);

			// only for aggregates
			if ($url == null) {
				$curr['urls'] = $d['numurls'];
				$curr['measurements']['percentages'] = array(
					'flash' => $d['perFlash'],
					'https' => $d['perHttps'],
					'redirects' => $d['perRedirects'],
					'errors' => $d['perErrors'],
					'cachingHeaders' => $d['maxageNull'],
					'googleLibraries' => $d['perGlibs']
				);
			} 
			$totalData[] = $curr;
		}

		$response['body'] = array(
            'data' => array(
				'items' => $totalData
            )
        );
	}

	return $response;
}

$resp = process(array(
	'status' => 'HTTP/1.1 200 OK',
	'headers' => array(),
	'callback' => null,
	'body' => ''
));

header($resp['status']);
foreach ($resp['headers'] as $header) {
    header($header);
}
$body = json_encode($resp['body']);
if ($resp['callback'] != null) {
	$body = $resp['callback'] . '(' . $body . ')';
}
echo $body;
