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

require_once("settings.inc");

// TODO - remove this - it's deprecated
$gArchive = "All";

// Soon we'll add a date range selector.
// For now I just want to exclude the early runs with only ~1500 URLs vs today's 15K URLS.
// Later I hope it'll make it easier to identify where we need to incorporate a date
// range by searching for this variable.
$gbDev = ( strpos(getcwd(), "/dev/") || strpos(getcwd(), "/trunk.httparchive.org") );
$gbMobile = ( strpos(getcwd(), "/mobile/") || strpos(getcwd(), "/mobile.httparchive.org") );
$gDateRange = ( $gbMobile ? "pageid >= 0" : "pageid >= 10281" );

// default table names
$gPagesTable = "pages";
$gRequestsTable = "requests";
$gStatusTable = "status";
$gUrlsTable = "urls";
$gStatsTable = "stats";
$gSettingsTable = "settings"; // for storing misc settings persistently

// Desktop tables
$gPagesTableDesktop = $gPagesTable;
$gRequestsTableDesktop = $gRequestsTable;
$gStatusTableDesktop = $gStatusTable;
$gStatsTableDesktop = $gStatsTable;

// Mobile tables
$gPagesTableMobile = $gPagesTable . "mobile";
$gRequestsTableMobile = $gRequestsTable . "mobile";
$gStatusTableMobile = $gStatusTable . "mobile";
$gStatsTableMobile = $gStatsTable;  // share the data table - a first step toward a single DB

// Dev tables
$gPagesTableDev = $gPagesTable . "dev";
$gRequestsTableDev = $gRequestsTable . "dev";
$gStatusTableDev = $gStatusTable . "dev";
$gStatsTableDev = $gStatsTable . "dev";
$gUrlsTableDev = $gUrlsTable . "dev";

// 
// HERE'S WHERE WE CHANGE THE DEFAULT TABLE NAMES 
// DEPENDING ON WHETHER WE'RE DEV OR MOBILE
// 
if ( $gbDev ) {
	// Use a dev version of the database tables if "dev/" is in the path.
	$gPagesTable = $gPagesTableDev;
	$gRequestsTable = $gRequestsTableDev;
	$gStatusTable = $gStatusTableDev;
	$gStatsTable = $gStatsTableDev;
	$gUrlsTable = $gUrlsTableDev;
}
else if ( $gbMobile ) {
	// Use a mobile version of the database tables if "mobile" is in the path.
	$gPagesTable = $gPagesTableMobile;
	$gRequestsTable = $gRequestsTableMobile;
	$gStatusTable = $gStatusTableMobile;
	$gStatsTable = $gStatsTableMobile;
}

// Hide archives while we're importing them.
$ghHiddenArchives = array(
						  "Fortune 1000" => 1
						  );

// The different "slices" of URLs a user can view.
// Each element is an array of [dbname, UI name]
$gaSlices = array( array("All", "All"),
					array("intersection", "intersection"),
					array("Top100", "Top 100"),
					array("Top1000", "Top 1000")
					);

$gaDevices = array( "IE", "iphone" );

$ghMonths = array(
				  "Jan" => 1,
				  "Feb" => 2,
				  "Mar" => 3,
				  "Apr" => 4,
				  "May" => 5,
				  "Jun" => 6,
				  "Jul" => 7,
				  "Aug" => 8,
				  "Sep" => 9,
				  "Oct" => 10,
				  "Nov" => 11,
				  "Dec" => 12
				  );

// mapping of headers to DB fields
// IF YOU CHANGE THESE YOU HAVE TO REBUILD THE REQUESTS TABLE!!!!!!!!!!!!!!!!!!!!!!!!!!
$ghReqHeaders = array(
					  "accept" => "req_accept",
					  "accept-charset" => "req_accept_charset",
					  "accept-encoding" => "req_accept_encoding",
					  "accept-language" => "req_accept_language",
					  "connection" => "req_connection",
					  "host" => "req_host",
					  "if-modified-since" => "req_if_modified_since",
					  "if-none-match" => "req_if_none_match",
					  "referer" => "req_referer",
					  "user-agent" => "req_user_agent"
					  );

$ghRespHeaders = array(
					   "accept-ranges" => "resp_accept_ranges",
					   "age" => "resp_age",
					   "cache-control" => "resp_cache_control",
					   "connection" => "resp_connection",
					   "content-encoding" => "resp_content_encoding",
					   "content-language" => "resp_content_language",
					   "content-length" => "resp_content_length",
					   "content-location" => "resp_content_location",
					   "content-type" => "resp_content_type",
					   "date" => "resp_date",
					   "etag" => "resp_etag",
					   "expires" => "resp_expires",
					   "keep-alive" => "resp_keep_alive",
					   "last-modified" => "resp_last_modified",
					   "location" => "resp_location",
					   "pragma" => "resp_pragma",
					   "server" => "resp_server",
					   "transfer-encoding" => "resp_transfer_encoding",
					   "vary" => "resp_vary",
					   "via" => "resp_via",
					   "x-powered-by" => "resp_x_powered_by"
					   );

// map a human-readable title to each DB column
// (right now just $gPagesTable)
$ghColumnTitles = array (
						 "numurls" => "URLs Analyzed",
						 "onLoad" => "Load Time",
						 "renderStart" => "Start Render Time",
						 "PageSpeed" => "Page Speed Score",
						 "reqTotal" => "Total Requests",
						 "bytesTotal" => "Total Transfer Size",
						 "reqHtml" => "HTML Requests",
						 "bytesHtml" => "HTML Transfer Size",
						 "reqJS" => "JS Requests",
						 "bytesJS" => "JS Transfer Size",
						 "reqCSS" => "CSS Requests",
						 "bytesCSS" => "CSS Transfer Size",
						 "reqImg" => "Image Requests",
						 "bytesImg" => "Image Transfer Size",
						 "reqFlash" => "Flash Requests",
						 "bytesFlash" => "Flash Transfer Size",
						 "numDomains" => "Domains"
						 );


// The world's top 100 websites according to Alexa.com
// This is derived by taking the top 100 sites in Alexa's list that actually work when crawled.
// e.g, bp.blogspot.com doesn't work even though it's still in Alexa's top 100.
$gaTop100 = array(
					"http://www.google.com/",
					"http://www.facebook.com/",
					"http://www.youtube.com/",
					"http://www.yahoo.com/",
					"http://www.blogspot.com/",
					"http://www.baidu.com/",
					"http://www.wikipedia.org/",
					"http://www.live.com/",
					"http://www.twitter.com/",
					"http://www.qq.com/",
					"http://www.msn.com/",
					"http://www.yahoo.co.jp/",
					"http://www.sina.com.cn/",
					"http://www.taobao.com/",
					"http://www.google.co.in/",
					"http://www.amazon.com/",
					"http://www.linkedin.com/",
					"http://www.wordpress.com/",
					"http://www.google.de/",
					"http://www.google.com.hk/",
					"http://www.bing.com/",
					"http://www.google.co.uk/",
					"http://www.yandex.ru/",
					"http://www.ebay.com/",
					"http://www.google.co.jp/",
					"http://www.microsoft.com/",
					"http://www.google.fr/",
					"http://www.google.com.br/",
					"http://www.flickr.com/",
					"http://www.paypal.com/",
					"http://www.fc2.com/",
					"http://www.mail.ru/",
					"http://www.google.it/",
					"http://www.craigslist.org/",
					"http://www.google.es/",
					"http://www.apple.com/",
					"http://www.imdb.com/",
					"http://www.bbc.co.uk/",
					"http://www.google.ru/",
					"http://www.ask.com/",
					"http://www.sohu.com/",
					"http://www.go.com/",
					"http://www.vkontakte.ru/",
					"http://www.xvideos.com/",
					"http://www.tumblr.com/",
					"http://www.cnn.com/",
					"http://www.livejasmin.com/",
					"http://www.megaupload.com/",
					"http://www.soso.com/",
					"http://www.google.ca/",
					"http://www.aol.com/",
					"http://www.youku.com/",
					"http://www.xhamster.com/",
					"http://www.tudou.com/",
					"http://www.yieldmanager.com/",
					"http://www.mediafire.com/",
					"http://www.zedo.com/",
					"http://www.pornhub.com/",
					"http://www.godaddy.com/",
					"http://www.adobe.com/",
					"http://www.ifeng.com/",
					"http://www.espn.go.com/",
					"http://www.google.co.id/",
					"http://www.wordpress.org/",
					"http://www.about.com/",
					"http://www.ameblo.jp/",
					"http://www.rakuten.co.jp/",
					"http://www.4shared.com/",
					"http://www.ebay.de/",
					"http://www.livejournal.com/",
					"http://www.google.com.tr/",
					"http://www.livedoor.com/",
					"http://www.google.com.mx/",
					"http://www.alibaba.com/",
					"http://www.google.com.au/",
					"http://www.myspace.com/",
					"http://www.youporn.com/",
					"http://www.cnet.com/",
					"http://www.uol.com.br/",
					"http://www.renren.com/",
					"http://www.google.pl/",
					"http://www.nytimes.com/",
					"http://www.conduit.com/",
					"http://www.hao123.com/",
					"http://www.thepiratebay.org/",
					"http://www.orkut.com.br/",
					"http://www.ebay.co.uk/",
					"http://www.cnzz.com/",
					"http://www.orkut.com/",
					"http://www.chinaz.com/",
					"http://www.fileserve.com/",
					"http://www.netflix.com/",
					"http://www.twitpic.com/",
					"http://www.weather.com/",
					"http://www.doubleclick.com/",
					"http://www.google.com.sa/",
					"http://www.amazon.de/",
					"http://www.dailymotion.com/",
					"http://www.tmall.com/",
					"http://www.stumbleupon.com/"
					);

$gaTop1000 = array(
				   "http://www.google.com/",
				   "http://www.facebook.com/",
				   "http://www.youtube.com/",
				   "http://www.yahoo.com/",
				   "http://www.blogspot.com/",
				   "http://www.baidu.com/",
				   "http://www.wikipedia.org/",
				   "http://www.live.com/",
				   "http://www.twitter.com/",
				   "http://www.qq.com/",
				   "http://www.msn.com/",
				   "http://www.yahoo.co.jp/",
				   "http://www.sina.com.cn/",
				   "http://www.taobao.com/",
				   "http://www.google.co.in/",
				   "http://www.amazon.com/",
				   "http://www.linkedin.com/",
				   "http://www.wordpress.com/",
				   "http://www.google.de/",
				   "http://www.google.com.hk/",
				   "http://www.bing.com/",
				   "http://www.google.co.uk/",
				   "http://www.yandex.ru/",
				   "http://www.ebay.com/",
				   "http://www.google.co.jp/",
				   "http://www.microsoft.com/",
				   "http://www.google.fr/",
				   "http://www.google.com.br/",
				   "http://www.flickr.com/",
				   "http://www.paypal.com/",
				   "http://www.fc2.com/",
				   "http://www.mail.ru/",
				   "http://www.google.it/",
				   "http://www.craigslist.org/",
				   "http://www.google.es/",
				   "http://www.apple.com/",
				   "http://www.imdb.com/",
				   "http://www.bbc.co.uk/",
				   "http://www.google.ru/",
				   "http://www.ask.com/",
				   "http://www.sohu.com/",
				   "http://www.go.com/",
				   "http://www.vkontakte.ru/",
				   "http://www.xvideos.com/",
				   "http://www.tumblr.com/",
				   "http://www.cnn.com/",
				   "http://www.livejasmin.com/",
				   "http://www.megaupload.com/",
				   "http://www.soso.com/",
				   "http://www.google.ca/",
				   "http://www.aol.com/",
				   "http://www.youku.com/",
				   "http://www.xhamster.com/",
				   "http://www.tudou.com/",
				   "http://www.yieldmanager.com/",
				   "http://www.mediafire.com/",
				   "http://www.zedo.com/",
				   "http://www.pornhub.com/",
				   "http://www.godaddy.com/",
				   "http://www.adobe.com/",
				   "http://www.ifeng.com/",
				   "http://www.espn.go.com/",
				   "http://www.google.co.id/",
				   "http://www.wordpress.org/",
				   "http://www.about.com/",
				   "http://www.ameblo.jp/",
				   "http://www.rakuten.co.jp/",
				   "http://www.4shared.com/",
				   "http://www.ebay.de/",
				   "http://www.livejournal.com/",
				   "http://www.google.com.tr/",
				   "http://www.livedoor.com/",
				   "http://www.google.com.mx/",
				   "http://www.alibaba.com/",
				   "http://www.google.com.au/",
				   "http://www.myspace.com/",
				   "http://www.youporn.com/",
				   "http://www.cnet.com/",
				   "http://www.uol.com.br/",
				   "http://www.renren.com/",
				   "http://www.google.pl/",
				   "http://www.nytimes.com/",
				   "http://www.conduit.com/",
				   "http://www.hao123.com/",
				   "http://www.thepiratebay.org/",
				   "http://www.orkut.com.br/",
				   "http://www.ebay.co.uk/",
				   "http://www.cnzz.com/",
				   "http://www.orkut.com/",
				   "http://www.chinaz.com/",
				   "http://www.fileserve.com/",
				   "http://www.netflix.com/",
				   "http://www.twitpic.com/",
				   "http://www.weather.com/",
				   "http://www.doubleclick.com/",
				   "http://www.google.com.sa/",
				   "http://www.amazon.de/",
				   "http://www.dailymotion.com/",
				   "http://www.tmall.com/",
				   "http://www.stumbleupon.com/",
				   "http://www.ehow.com/",
				   "http://www.amazon.co.jp/",
				   "http://www.odnoklassniki.ru/",
				   "http://www.hotfile.com/",
				   "http://www.tube8.com/",
				   "http://www.rapidshare.com/",
				   "http://www.google.nl/",
				   "http://www.globo.com/",
				   "http://www.imageshack.us/",
				   "http://www.huffingtonpost.com/",
				   "http://www.megavideo.com/",
				   "http://www.goo.ne.jp/",
				   "http://www.tianya.cn/",
				   "http://www.secureserver.net/",
				   "http://www.alipay.com/",
				   "http://www.taringa.net/",
				   "http://www.photobucket.com/",
				   "http://www.deviantart.com/",
				   "http://www.imgur.com/",
				   "http://www.badoo.com/",
				   "http://www.mozilla.com/",
				   "http://www.optmd.com/",
				   "http://www.sparkstudios.com/",
				   "http://www.aweber.com/",
				   "http://www.xnxx.com/",
				   "http://www.douban.com/",
				   "http://www.babylon.com/",
				   "http://www.filestube.com/",
				   "http://www.redtube.com/",
				   "http://www.spiegel.de/",
				   "http://www.reddit.com/",
				   "http://www.google.cn/",
				   "http://www.addthis.com/",
				   "http://www.amazon.co.uk/",
				   "http://www.vimeo.com/",
				   "http://www.digg.com/",
				   "http://www.mixi.jp/",
				   "http://www.clicksor.com/",
				   "http://www.fbcdn.net/",
				   "http://www.indiatimes.com/",
				   "http://www.bankofamerica.com/",
				   "http://www.filesonic.com/",
				   "http://www.sourceforge.net/",
				   "http://www.answers.com/",
				   "http://www.google.com.eg/",
				   "http://www.nicovideo.jp/",
				   "http://www.dailymail.co.uk/",
				   "http://www.360buy.com/",
				   "http://www.amazonaws.com/",
				   "http://www.google.com.pk/",
				   "http://www.bit.ly/",
				   "http://www.google.co.th/",
				   "http://www.statcounter.com/",
				   "http://www.xtendmedia.com/",
				   "http://www.56.com/",
				   "http://www.kaixin001.com/",
				   "http://www.rediff.com/",
				   "http://www.ezinearticles.com/",
				   "http://www.download.com/",
				   "http://www.google.co.za/",
				   "http://www.youjizz.com/",
				   "http://www.domaintools.com/",
				   "http://www.liveinternet.ru/",
				   "http://www.reference.com/",
				   "http://www.google.com.ar/",
				   "http://www.chase.com/",
				   "http://www.espncricinfo.com/",
				   "http://www.rambler.ru/",
				   "http://www.maktoob.com/",
				   "http://www.naver.com/",
				   "http://www.ku6.com/",
				   "http://www.58.com/",
				   "http://www.clickbank.com/",
				   "http://www.foxnews.com/",
				   "http://www.digitalpoint.com/",
				   "http://www.xinhuanet.com/",
				   "http://www.ucoz.ru/",
				   "http://www.yfrog.com/",
				   "http://www.angege.com/",
				   "http://files.wordpress.com/",
				   "http://www.blogfa.com/",
				   "http://www.mashable.com/",
				   "http://www.bild.de/",
				   "http://www.guardian.co.uk/",
				   "http://www.onet.pl/",
				   "http://www.wikimedia.org/",
				   "http://www.free.fr/",
				   "http://www.orkut.co.in/",
				   "http://www.ameba.jp/",
				   "http://www.pconline.com.cn/",
				   "http://www.w3schools.com/",
				   "http://www.typepad.com/",
				   "http://www.warriorforum.com/",
				   "http://www.squidoo.com/",
				   "http://www.terra.com.br/",
				   "http://www.etsy.com/",
				   "http://www.scribd.com/",
				   "http://www.wsj.com/",
				   "http://www.comcast.net/",
				   "http://www.wikia.com/",
				   "http://www.salesforce.com/",
				   "http://www.adultfriendfinder.com/",
				   "http://www.allegro.pl/",
				   "http://www.zol.com.cn/",
				   "http://www.google.com.my/",
				   "http://www.orange.fr/",
				   "http://www.adf.ly/",
				   "http://www.google.be/",
				   "http://www.php.net/",
				   "http://www.hatena.ne.jp/",
				   "http://www.youdao.com/",
				   "http://www.hostgator.com/",
				   "http://www.in.com/",
				   "http://www.reuters.com/",
				   "http://www.51.la/",
				   "http://www.hulu.com/",
				   "http://www.google.gr/",
				   "http://www.skype.com/",
				   "http://www.icio.us/",
				   "http://www.narod.ru/",
				   "http://www.xunlei.com/",
				   "http://www.google.com.vn/",
				   "http://www.rutracker.org/",
				   "http://www.gmx.net/",
				   "http://www.csdn.net/",
				   "http://www.kaskus.us/",
				   "http://www.2ch.net/",
				   "http://www.ganji.com/",
				   "http://www.partypoker.com/",
				   "http://www.archive.org/",
				   "http://www.joomla.org/",
				   "http://www.nba.com/",
				   "http://www.mywebsearch.com/",
				   "http://www.web.de/",
				   "http://www.techcrunch.com/",
				   "http://www.libero.it/",
				   "http://www.wretch.cc/",
				   "http://www.telegraph.co.uk/",
				   "http://www.hp.com/",
				   "http://www.depositfiles.com/",
				   "http://www.seesaa.net/",
				   "http://www.hootsuite.com/",
				   "http://www.repubblica.it/",
				   "http://www.126.com/",
				   "http://www.cj.com/",
				   "http://www.leboncoin.fr/",
				   "http://www.qiyi.com/",
				   "http://www.dell.com/",
				   "http://www.ning.com/",
				   "http://www.slideshare.net/",
				   "http://www.constantcontact.com/",
				   "http://www.google.com.tw/",
				   "http://www.google.se/",
				   "http://www.xing.com/",
				   "http://www.nifty.com/",
				   "http://www.google.at/",
				   "http://www.wellsfargo.com/",
				   "http://www.google.com.ua/",
				   "http://www.mozilla.org/",
				   "http://www.marca.com/",
				   "http://www.wp.pl/",
				   "http://www.usps.com/",
				   "http://www.soku.com/",
				   "http://www.tribalfusion.com/",
				   "http://www.istockphoto.com/",
				   "http://www.hubpages.com/",
				   "http://www.themeforest.net/",
				   "http://www.google.ch/",
				   "http://www.linkwithin.com/",
				   "http://www.daum.net/",
				   "http://www.google.ro/",
				   "http://www.metacafe.com/",
				   "http://www.avg.com/",
				   "http://www.tagged.com/",
				   "http://www.homeway.com.cn/",
				   "http://www.zynga.com/",
				   "http://www.tripadvisor.com/",
				   "http://www.cam4.com/",
				   "http://www.booking.com/",
				   "http://www.freelancer.com/",
				   "http://www.walmart.com/",
				   "http://www.ups.com/",
				   "http://www.opendns.com/",
				   "http://www.engadget.com/",
				   "http://www.hudong.com/",
				   "http://www.people.com.cn/",
				   "http://www.spankwire.com/",
				   "http://www.match.com/",
				   "http://www.thefreedictionary.com/",
				   "http://www.imagevenue.com/",
				   "http://www.mlb.com/",
				   "http://www.wordreference.com/",
				   "http://www.yesky.com/",
				   "http://www.360.cn/",
				   "http://www.dropbox.com/",
				   "http://www.plentyoffish.com/",
				   "http://www.kooora.com/",
				   "http://www.google.com.ph/",
				   "http://www.hardsextube.com/",
				   "http://www.w3.org/",
				   "http://www.google.pt/",
				   "http://www.paipai.com/",
				   "http://www.search-results.com/",
				   "http://www.biglobe.ne.jp/",
				   "http://www.ig.com.br/",
				   "http://www.latimes.com/",
				   "http://www.eastmoney.com/",
				   "http://www.groupon.com/",
				   "http://www.neobux.com/",
				   "http://www.china.com/",
				   "http://www.ign.com/",
				   "http://www.10086.cn/",
				   "http://www.ebay.it/",
				   "http://www.zimbio.com/",
				   "http://www.duckload.com/",
				   "http://www.facemoods.com/",
				   "http://www.seznam.cz/",
				   "http://www.google.com.ng/",
				   "http://www.google.co.ve/",
				   "http://www.51job.com/",
				   "http://www.snapdeal.com/",
				   "http://www.love21cn.com/",
				   "http://www.elance.com/",
				   "http://www.xe.com/",
				   "http://www.outbrain.com/",
				   "http://www.fiverr.com/",
				   "http://www.sakura.ne.jp/",
				   "http://www.pandora.com/",
				   "http://www.tradedoubler.com/",
				   "http://www.megaclick.com/",
				   "http://www.leo.org/",
				   "http://www.softonic.com/",
				   "http://www.sitesell.com/",
				   "http://www.amazon.cn/",
				   "http://www.kakaku.com/",
				   "http://www.ikea.com/",
				   "http://www.webs.com/",
				   "http://www.hi5.com/",
				   "http://www.dianping.com/",
				   "http://www.time.com/",
				   "http://www.plixi.com/",
				   "http://www.keezmovies.com/",
				   "http://www.goal.com/",
				   "http://www.drupal.org/",
				   "http://www.abcnews.go.com/",
				   "http://www.alimama.com/",
				   "http://www.vnexpress.net/",
				   "http://www.t-online.de/",
				   "http://www.google.com.co/",
				   "http://www.mybrowserbar.com/",
				   "http://www.gamespot.com/",
				   "http://www.google.com.sg/",
				   "http://www.vancl.com/",
				   "http://www.corriere.it/",
				   "http://www.onbux.com/",
				   "http://www.4399.com/",
				   "http://www.expedia.com/",
				   "http://www.over-blog.com/",
				   "http://www.bluehost.com/",
				   "http://www.tom.com/",
				   "http://www.nih.gov/",
				   "http://www.google.cl/",
				   "http://www.indeed.com/",
				   "http://www.elpais.com/",
				   "http://www.google.ae/",
				   "http://www.justin.tv/",
				   "http://www.letitbit.net/",
				   "http://www.tinypic.com/",
				   "http://www.aljazeera.net/",
				   "http://www.multiply.com/",
				   "http://www.google.co.kr/",
				   "http://www.gotomeeting.com/",
				   "http://www.feedburner.com/",
				   "http://www.dmm.co.jp/",
				   "http://www.btjunkie.org/",
				   "http://www.bestbuy.com/",
				   "http://www.target.com/",
				   "http://www.drudgereport.com/",
				   "http://www.weebly.com/",
				   "http://www.skyrock.com/",
				   "http://www.fedex.com/",
				   "http://www.att.com/",
				   "http://www.myegy.com/",
				   "http://www.forbes.com/",
				   "http://www.google.co.hu/",
				   "http://www.brothersoft.com/",
				   "http://www.ero-advertising.com/",
				   "http://www.usatoday.com/",
				   "http://www.washingtonpost.com/",
				   "http://www.softpedia.com/",
				   "http://www.google.ie/",
				   "http://www.lzjl.com/",
				   "http://www.ustream.tv/",
				   "http://www.mercadolivre.com.br/",
				   "http://www.ynet.com/",
				   "http://www.virgilio.it/",
				   "http://www.lenta.ru/",
				   "http://www.comcast.com/",
				   "http://www.rr.com/",
				   "http://www.bearshare.com/",
				   "http://www.huanqiu.com/",
				   "http://www.sape.ru/",
				   "http://www.cz.cc/",
				   "http://www.jquery.com/",
				   "http://www.elmundo.es/",
				   "http://www.autohome.com.cn/",
				   "http://www.verycd.com/",
				   "http://www.samsung.com/",
				   "http://www.mgid.com/",
				   "http://www.americanexpress.com/",
				   "http://www.odesk.com/",
				   "http://www.google.no/",
				   "http://www.admin5.com/",
				   "http://www.commentcamarche.net/",
				   "http://www.shutterstock.com/",
				   "http://www.google.dk/",
				   "http://www.google.com.pe/",
				   "http://www.intuit.com/",
				   "http://www.bigpoint.com/",
				   "http://www.geocities.jp/",
				   "http://www.slutload.com/",
				   "http://www.nk.pl/",
				   "http://www.drtuber.com/",
				   "http://www.bloomberg.com/",
				   "http://www.it168.com/",
				   "http://www.hurriyet.com.tr/",
				   "http://www.rbc.ru/",
				   "http://www.exblog.jp/",
				   "http://www.basecamphq.com/",
				   "http://www.vk.com/",
				   "http://www.people.com/",
				   "http://www.dangdang.com/",
				   "http://www.mynet.com/",
				   "http://www.cocolog-nifty.com/",
				   "http://www.pchome.net/",
				   "http://www.articlesbase.com/",
				   "http://www.ebay.com.au/",
				   "http://www.yomiuri.co.jp/",
				   "http://www.imesh.com/",
				   "http://www.51.com/",
				   "http://www.mihanblog.com/",
				   "http://www.meetup.com/",
				   "http://www.surveymonkey.com/",
				   "http://www.zing.vn/",
				   "http://www.ya.ru/",
				   "http://www.tmz.com/",
				   "http://www.mpnrs.com/",
				   "http://www.milliyet.com.tr/",
				   "http://www.pcpop.com/",
				   "http://www.softlayer.com/",
				   "http://www.imagebam.com/",
				   "http://www.gougou.com/",
				   "http://www.posterous.com/",
				   "http://www.google.fi/",
				   "http://www.youm7.com/",
				   "http://www.businessinsider.com/",
				   "http://www.newegg.com/",
				   "http://www.gazeta.pl/",
				   "http://www.tnaflix.com/",
				   "http://www.peyvandha.ir/",
				   "http://www.altervista.org/",
				   "http://www.ebay.fr/",
				   "http://www.z5x.net/",
				   "http://www.cntv.cn/",
				   "http://www.formspring.me/",
				   "http://www.dmoz.org/",
				   "http://www.camzap.com/",
				   "http://www.soundcloud.com/",
				   "http://www.39.net/",
				   "http://www.habrahabr.ru/",
				   "http://www.shareasale.com/",
				   "http://www.nhk.or.jp/",
				   "http://www.pokerstrategy.com/",
				   "http://www.ibm.com/",
				   "http://www.gutefrage.net/",
				   "http://www.tweetmeme.com/",
				   "http://www.fastclick.com/",
				   "http://www.ocn.ne.jp/",
				   "http://www.v1.cn/",
				   "http://www.smashingmagazine.com/",
				   "http://www.ziddu.com/",
				   "http://www.monster.com/",
				   "http://www.anonym.to/",
				   "http://www.enterfactory.com/",
				   "http://www.zhaopin.com/",
				   "http://www.livescore.com/",
				   "http://www.news.com.au/",
				   "http://www.dtiblog.com/",
				   "http://www.irs.gov/",
				   "http://www.chip.de/",
				   "http://www.naukri.com/",
				   "http://www.google.co.il/",
				   "http://www.theplanet.com/",
				   "http://www.megaporn.com/",
				   "http://www.fotolia.com/",
				   "http://www.sitemeter.com/",
				   "http://www.pogo.com/",
				   "http://www.baixing.com/",
				   "http://www.icontact.com/",
				   "http://www.verizonwireless.com/",
				   "http://www.way2sms.com/",
				   "http://www.warez-bb.org/",
				   "http://www.blackhatworld.com/",
				   "http://www.37lai.com/",
				   "http://www.multiupload.com/",
				   "http://www.last.fm/",
				   "http://www.seriesyonkis.com/",
				   "http://www.mop.com/",
				   "http://www.blackberry.com/",
				   "http://www.hypergames.net/",
				   "http://www.oneindia.in/",
				   "http://www.wikihow.com/",
				   "http://www.asahi.com/",
				   "http://www.adultadworld.com/",
				   "http://www.qidian.com/",
				   "http://www.mobile.de/",
				   "http://www.google.cz/",
				   "http://www.excite.co.jp/",
				   "http://www.gsmarena.com/",
				   "http://www.sunporno.com/",
				   "http://www.cnbc.com/",
				   "http://www.templatemonster.com/",
				   "http://www.glispa.com/",
				   "http://www.mapquest.com/",
				   "http://www.careerbuilder.com/",
				   "http://www.hc360.com/",
				   "http://www.github.com/",
				   "http://www.cncmax.cn/",
				   "http://www.webmasterworld.com/",
				   "http://www.kickasstorrents.com/",
				   "http://www.nhl.com/",
				   "http://www.android.com/",
				   "http://www.gc.ca/",
				   "http://www.miniclip.com/",
				   "http://www.heroturko.org/",
				   "http://www.pornhost.com/",
				   "http://www.tabelog.com/",
				   "http://www.as.com/",
				   "http://www.ibibo.com/",
				   "http://www.who.is/",
				   "http://www.infusionsoft.com/",
				   "http://www.beemp3.com/",
				   "http://www.kijiji.ca/",
				   "http://www.hdfcbank.com/",
				   "http://www.2345.com/",
				   "http://www.so-net.ne.jp/",
				   "http://www.mysql.com/",
				   "http://www.wunderground.com/",
				   "http://www.speedtest.net/",
				   "http://www.mercadolibre.com.mx/",
				   "http://www.friendfeed.com/",
				   "http://www.mailchimp.com/",
				   "http://www.adult-empire.com/",
				   "http://www.jugem.jp/",
				   "http://www.thesun.co.uk/",
				   "http://www.infoseek.co.jp/",
				   "http://www.inetglobal.com/",
				   "http://www.xcar.com.cn/",
				   "http://www.extratorrent.com/",
				   "http://www.immobilienscout24.de/",
				   "http://www.verizon.com/",
				   "http://www.duowan.com/",
				   "http://www.cbsnews.com/",
				   "http://www.ovh.net/",
				   "http://www.115.com/",
				   "http://www.detik.com/",
				   "http://www.hyves.nl/",
				   "http://www.infolinks.com/",
				   "http://www.linkbucks.com/",
				   "http://www.oracle.com/",
				   "http://www.discuz.net/",
				   "http://www.playstation.com/",
				   "http://www.www.net.cn/",
				   "http://www.ndtv.com/",
				   "http://www.qip.ru/",
				   "http://www.abril.com.br/",
				   "http://www.asg.to/",
				   "http://www.weather.com.cn/",
				   "http://www.nu.nl/",
				   "http://www.nate.com/",
				   "http://www.livingsocial.com/",
				   "http://www.kinopoisk.ru/",
				   "http://www.scriptmafia.org/",
				   "http://www.oron.com/",
				   "http://www.clickbank.net/",
				   "http://www.partycasino.com/",
				   "http://www.yandex.ua/",
				   "http://www.appspot.com/",
				   "http://www.searchengines.ru/",
				   "http://www.admagnet.net/",
				   "http://www.foxsports.com/",
				   "http://www.tutsplus.com/",
				   "http://www.icbc.com.cn/",
				   "http://www.qq937.com/",
				   "http://www.okcupid.com/",
				   "http://www.blogimg.jp/",
				   "http://www.fatakat.com/",
				   "http://www.gocsgo.com/",
				   "http://www.nextag.com/",
				   "http://www.allrecipes.com/",
				   "http://www.zillow.com/",
				   "http://www.boston.com/",
				   "http://www.aliexpress.com/",
				   "http://www.lequipe.fr/",
				   "http://www.cashtrafic.com/",
				   "http://www.clixsense.com/",
				   "http://www.lemonde.fr/",
				   "http://www.uploading.com/",
				   "http://www.plimus.com/",
				   "http://www.cracked.com/",
				   "http://www.xtube.com/",
				   "http://www.traidnt.net/",
				   "http://www.google.co.ma/",
				   "http://www.zanox-affiliate.de/",
				   "http://www.force.com/",
				   "http://www.joy.cn/",
				   "http://www.mercadolibre.com.ar/",
				   "http://www.backpage.com/",
				   "http://www.tuenti.com/",
				   "http://www.bitauto.com/",
				   "http://www.smowtion.com/",
				   "http://www.pixiv.net/",
				   "http://www.atwiki.jp/",
				   "http://www.youjizzlive.com/",
				   "http://www.businessweek.com/",
				   "http://www.battle.net/",
				   "http://www.okwave.jp/",
				   "http://www.webmoney.ru/",
				   "http://www.timeanddate.com/",
				   "http://www.networkedblogs.com/",
				   "http://www.icicibank.com/",
				   "http://www.sulekha.com/",
				   "http://www.foursquare.com/",
				   "http://www.tripod.com/",
				   "http://www.vmn.net/",
				   "http://www.heise.de/",
				   "http://www.urbandictionary.com/",
				   "http://www.jeuxvideo.com/",
				   "http://www.marketwatch.com/",
				   "http://www.dantri.com.vn/",
				   "http://www.accuweather.com/",
				   "http://www.gamefaqs.com/",
				   "http://www.capitalone.com/",
				   "http://www.macrumors.com/",
				   "http://www.4chan.org/",
				   "http://www.seomoz.org/",
				   "http://www.amazon.fr/",
				   "http://www.mainichi.jp/",
				   "http://www.pch.com/",
				   "http://www.dyndns.org/",
				   "http://www.disney.go.com/",
				   "http://www.4tube.com/",
				   "http://www.jimdo.com/",
				   "http://www.viadeo.com/",
				   "http://www.grooveshark.com/",
				   "http://www.exbii.com/",
				   "http://www.wired.com/",
				   "http://www.interia.pl/",
				   "http://www.bodybuilding.com/",
				   "http://www.sapo.pt/",
				   "http://www.sahibinden.com/",
				   "http://www.getresponse.com/",
				   "http://www.filehippo.com/",
				   "http://www.webmd.com/",
				   "http://www.radikal.ru/",
				   "http://www.pornerbros.com/",
				   "http://www.eyny.com/",
				   "http://www.cnblogs.com/",
				   "http://www.persianblog.ir/",
				   "http://www.lifehacker.com/",
				   "http://www.hubspot.com/",
				   "http://www.google.sk/",
				   "http://www.custhelp.com/",
				   "http://www.mediaset.it/",
				   "http://www.homedepot.com/",
				   "http://www.break.com/",
				   "http://www.ca.gov/",
				   "http://www.opera.com/",
				   "http://www.examiner.com/",
				   "http://www.dreamstime.com/",
				   "http://www.manta.com/",
				   "http://www.freeones.com/",
				   "http://www.mcssl.com/",
				   "http://www.meituan.com/",
				   "http://www.google.co.nz/",
				   "http://www.instagr.am/",
				   "http://www.kompas.com/",
				   "http://www.nikkei.com/",
				   "http://www.whitepages.com/",
				   "http://www.marketgid.com/",
				   "http://www.namecheap.com/",
				   "http://www.sfgate.com/",
				   "http://www.msn.ca/",
				   "http://www.priceline.com/",
				   "http://www.magentocommerce.com/",
				   "http://www.beeg.com/",
				   "http://www.webhostingtalk.com/",
				   "http://www.iciba.com/",
				   "http://www.compete.com/",
				   "http://www.masrawy.com/",
				   "http://www.wix.com/",
				   "http://www.pcauto.com.cn/",
				   "http://www.onlinedown.net/",
				   "http://www.issuu.com/",
				   "http://www.nydailynews.com/",
				   "http://www.sanook.com/",
				   "http://www.mainadv.com/",
				   "http://www.sfr.fr/",
				   "http://www.google.kz/",
				   "http://www.metrolyrics.com/",
				   "http://www.discoverbing.com/",
				   "http://www.freakshare.com/",
				   "http://www.brazzers.com/",
				   "http://www.tinyurl.com/",
				   "http://www.paper.li/",
				   "http://www.trafficholder.com/",
				   "http://www.1und1.de/",
				   "http://www.retailmenot.com/",
				   "http://www.slickdeals.net/",
				   "http://www.hotels.com/",
				   "http://www.focus.cn/",
				   "http://www.19lou.com/",
				   "http://www.rakuten.ne.jp/",
				   "http://www.cbssports.com/",
				   "http://www.smh.com.au/",
				   "http://www.sueddeutsche.de/",
				   "http://www.icq.com/",
				   "http://www.ebay.in/",
				   "http://www.yellowpages.com/",
				   "http://www.7k7k.com/",
				   "http://www.logmein.com/",
				   "http://www.usbank.com/",
				   "http://www.itau.com.br/",
				   "http://www.nikkeibp.co.jp/",
				   "http://www.bleacherreport.com/",
				   "http://www.alphaporno.com/",
				   "http://www.songs.pk/",
				   "http://www.allocine.fr/",
				   "http://www.mtv.com/",
				   "http://www.xda-developers.com/",
				   "http://www.foxtab.com/",
				   "http://www.seobook.com/",
				   "http://www.alertpay.com/",
				   "http://www.gazzetta.it/",
				   "http://www.southwest.com/",
				   "http://www.zappos.com/",
				   "http://www.ikariam.com/",
				   "http://www.me.com/",
				   "http://www.hsbc.co.uk/",
				   "http://www.17173.com/",
				   "http://www.citibank.com/",
				   "http://www.incredimail.com/",
				   "http://www.swagbucks.com/",
				   "http://www.macys.com/",
				   "http://www.flippa.com/",
				   "http://www.wiktionary.org/",
				   "http://www.ctrip.com/",
				   "http://www.moneycontrol.com/",
				   "http://www.vente-privee.com/",
				   "http://www.ninemsn.com.au/",
				   "http://www.ct10000.com/",
				   "http://www.hostmonster.com/",
				   "http://www.skycn.com/",
				   "http://www.rtl.de/",
				   "http://www.earthlink.net/",
				   "http://www.sxc.hu/",
				   "http://www.enet.com.cn/",
				   "http://www.realtor.com/",
				   "http://www.sweetim.com/",
				   "http://www.freshwap.net/",
				   "http://www.linternaute.com/",
				   "http://www.hidemyass.com/",
				   "http://www.fastbrowsersearch.com/",
				   "http://www.rian.ru/",
				   "http://www.airtelforum.com/",
				   "http://www.aftonbladet.se/",
				   "http://www.telegraaf.nl/",
				   "http://www.zoho.com/",
				   "http://www.welt.de/",
				   "http://www.quora.com/",
				   "http://www.vivanews.com/",
				   "http://www.eluniversal.com.mx/",
				   "http://www.ppstream.com/",
				   "http://www.sitepoint.com/",
				   "http://www.marktplaats.nl/",
				   "http://www.dhgate.com/",
				   "http://www.goo.gl/",
				   "http://www.iminent.com/",
				   "http://www.howstuffworks.com/",
				   "http://www.google.com.kw/",
				   "http://www.xyxy.net/",
				   "http://www.pptv.com/",
				   "http://www.sidereel.com/",
				   "http://www.gap.com/",
				   "http://www.mail.com/",
				   "http://www.aruba.it/",
				   "http://www.sponichi.co.jp/",
				   "http://www.pixnet.net/",
				   "http://www.lefigaro.fr/",
				   "http://www.kino.to/",
				   "http://www.tabnak.ir/",
				   "http://www.sears.com/",
				   "http://www.rottentomatoes.com/",
				   "http://www.pomoho.com/",
				   "http://www.veoh.com/",
				   "http://www.barnesandnoble.com/",
				   "http://www.empflix.com/",
				   "http://www.cmbchina.com/",
				   "http://www.nokia.com/",
				   "http://www.cnbeta.com/",
				   "http://www.grepolis.com/",
				   "http://www.gismeteo.ru/",
				   "http://www.docin.com/",
				   "http://www.dict.cc/",
				   "http://www.ekolay.net/",
				   "http://www.kicker.de/",
				   "http://www.td.com/",
				   "http://www.partypoker.fr/",
				   "http://www.facebookofsex.com/",
				   "http://www.nipic.com/",
				   "http://www.pagesjaunes.fr/",
				   "http://www.liveperson.net/",
				   "http://www.bahn.de/",
				   "http://www.kayak.com/",
				   "http://www.perezhilton.com/",
				   "http://www.m-w.com/",
				   "http://www.alice.it/",
				   "http://www.informer.com/",
				   "http://www.yousendit.com/",
				   "http://www.ucoz.com/",
				   "http://www.norton.com/",
				   "http://www.clarin.com/",
				   "http://www.java.com/",
				   "http://www.mangafox.com/",
				   "http://www.sky.com/",
				   "http://www.orbitz.com/",
				   "http://www.makemytrip.com/",
				   "http://www.google.lk/",
				   "http://www.google.bg/",
				   "http://www.quikr.com/",
				   "http://www.npr.org/",
				   "http://www.laredoute.fr/",
				   "http://www.orf.at/",
				   "http://www.politico.com/",
				   "http://www.yoka.com/",
				   "http://www.babycenter.com/",
				   "http://www.buzzle.com/",
				   "http://www.google.com.qa/",
				   "http://www.pcworld.com/",
				   "http://www.nasa.gov/",
				   "http://www.hoopchina.com/",
				   "http://www.tubegalore.com/",
				   "http://www.mangastream.com/",
				   "http://www.1and1.com/",
				   "http://www.technorati.com/",
				   "http://www.searchqu.com/",
				   "http://www.rutube.ru/",
				   "http://www.myp2p.eu/",
				   "http://www.gumtree.com/",
				   "http://www.overstock.com/",
				   "http://www.24h.com.vn/",
				   "http://www.wer-kennt-wen.de/",
				   "http://www.musica.com/",
				   "http://www.coupons.com/",
				   "http://www.auto.ru/",
				   "http://www.mtime.com/",
				   "http://www.travian.ae/",
				   "http://www.wetter.com/",
				   "http://www.ubuntu.com/",
				   "http://www.myfreecams.com/",
				   "http://www.178.com/",
				   "http://www.dealextreme.com/",
				   "http://www.naver.jp/",
				   "http://www.cyworld.com/",
				   "http://www.buzzfeed.com/",
				   "http://www.allabout.co.jp/",
				   "http://www.docstoc.com/",
				   "http://www.bitshare.com/",
				   "http://www.trulia.com/",
				   "http://www.twiends.com/",
				   "http://www.picnik.com/",
				   "http://www.iconfinder.com/",
				   "http://www.indianrail.gov.in/",
				   "http://www.bharatstudent.com/",
				   "http://www.ebuddy.com/",
				   "http://www.ip138.com/",
				   "http://www.adscale.de/",
				   "http://www.120ask.com/",
				   "http://www.taleo.net/",
				   "http://www.gnavi.co.jp/",
				   "http://www.cookpad.com/",
				   "http://www.networksolutions.com/",
				   "http://www.stern.de/",
				   "http://www.woot.com/",
				   "http://www.europa.eu/",
				   "http://www.searchresultsdirect.com/",
				   "http://www.ultimate-guitar.com/",
				   "http://www.topix.com/",
				   "http://www.failblog.org/",
				   "http://www.cloob.com/",
				   "http://www.domainsite.com/",
				   "http://www.friendster.com/",
				   "http://www.shopping.com/",
				   "http://www.apache.org/",
				   "http://www.sanspo.com/",
				   "http://www.hattrick.org/",
				   "http://www.popeater.com/",
				   "http://www.gizmodo.com/",
				   "http://www.modelmayhem.com/",
				   "http://www.lowes.com/",
				   "http://www.intel.com/",
				   "http://www.nationalgeographic.com/",
				   "http://www.webgozar.com/",
				   "http://www.google.az/",
				   "http://www.idnes.cz/",
				   "http://www.worldstarhiphop.com/",
				   "http://www.weather.gov/",
				   "http://www.dl4all.com/",
				   "http://www.groupon.com.br/",
				   "http://www.haberturk.com/",
				   "http://www.qunar.com/",
				   "http://www.5d6d.com/",
				   "http://www.blogsky.com/",
				   "http://www.fishki.net/",
				   "http://www.ea.com/",
				   "http://www.dafont.com/",
				   "http://www.forumcommunity.net/",
				   "http://www.inbox.com/",
				   "http://www.123rf.com/",
				   "http://www.2leep.com/",
				   "http://www.6.cn/",
				   "http://www.askmen.com/",
				   "http://www.ahram.org.eg/",
				   "http://www.yam.com/",
				   "http://www.novinky.cz/",
				   "http://www.independent.co.uk/",
				   "http://www.postbank.de/",
				   "http://www.pingomatic.com/",
				   "http://www.zazzle.com/",
				   "http://www.lacaixa.es/",
				   "http://www.semrush.com/",
				   "http://www.zshare.net/",
				   "http://www.lenovo.com/",
				   "http://www.merchantcircle.com/",
				   "http://www.realitykings.com/",
				   "http://www.japanpost.jp/",
				   "http://www.sendspace.com/",
				   "http://www.made-in-china.com/",
				   "http://www.mangareader.net/",
				   "http://www.studiverzeichnis.com/",
				   "http://www.uploaded.to/",
				   "http://www.giveawayoftheday.com/",
				   "http://www.zedge.net/",
				   "http://www.cbc.ca/",
				   "http://www.letv.com/",
				   "http://www.justdial.com/",
				   "http://www.livestream.com/",
				   "http://www.groupon.cn/",
				   "http://www.jrj.com.cn/",
				   "http://www.asp.net/",
				   "http://www.eventbrite.com/",
				   "http://www.deezer.com/",
				   "http://www.xbox.com/",
				   "http://www.gamer.com.tw/",
				   "http://www.alarabiya.net/",
				   "http://www.ubuntuforums.org/",
				   "http://www.jiji.com/",
				   "http://www.sify.com/",
				   "http://www.avaxhome.ws/",
				   "http://www.blogbus.com/",
				   "http://www.teacup.com/",
				   "http://www.cbslocal.com/",
				   "http://www.vg.no/",
				   "http://www.ancestry.com/",
				   "http://www.impress.co.jp/",
				   "http://www.wachovia.com/",
				   "http://www.foodnetwork.com/",
				   "http://www.tgbus.com/",
				   "http://www.hawaaworld.com/",
				   "http://www.focus.de/",
				   "http://www.subscene.com/",
				   "http://www.pornoxo.com/",
				   "http://www.zendesk.com/",
				   "http://www.imvu.com/",
				   "http://www.egotastic.com/",
				   "http://www.tiexue.net/",
				   "http://www.pcmag.com/",
				   "http://www.fling.com/",
				   "http://www.exoclick.com/",
				   "http://www.delta.com/",
				   "http://www.klikbca.com/",
				   "http://www.globe7.com/",
				   "http://www.bigfishgames.com/",
				   "http://www.partypoker.it/",
				   "http://www.armorgames.com/",
				   "http://www.skysports.com/",
				   "http://www.sdo.com/",
				   "http://www.mercadolibre.com/",
				   "http://www.nypost.com/",
				   "http://www.linkhelper.cn/"
				   );



// Don't link to some websites.
$ghBlackList = array(
					 "xhamsterhq.com" => 1, "www.xhamsterhq.com" => 1,
					 "xxxbunker.com" => 1, "www.xxxbunker.com" => 1,
					 "grannybet.com" => 1, "www.grannybet.com" => 1,
					 "zoosection.com" => 1, "www.zoosection.com" => 1,
					 "sexlunch.com" => 1, "www.sexlunch.com" => 1,
					 "freepornii.com" => 1, "www.freepornii.com" => 1,
					 "amateurniches.com" => 1, "www.amateurniches.com" => 1,
					 "video-one.com" => 1, "www.video-one.com" => 1,
					 "yournnpic.com" => 1, "www.yournnpic.com" => 1,
					 "cumdisgrace.com" => 1,
					 "www.cumdisgrace.com" => 1,
					 "cumilf.com" => 1,
					 "www.cumilf.com" => 1,
					 "cumlouder.com" => 1,
					 "www.cumlouder.com" => 1,
					 "cummingmatures.com" => 1,
					 "www.cummingmatures.com" => 1,
					 "cumonwives.com" => 1,
					 "www.cumonwives.com" => 1,
					 "cumshotsurprise.com" => 1,
					 "www.cumshotsurprise.com" => 1,
					 "straponcum.com" => 1,
					 "www.straponcum.com" => 1,
					 "fuckbookdating.com" => 1,
					 "www.fuckbookdating.com" => 1,
					 "fuckingmachines.com" => 1,
					 "www.fuckingmachines.com" => 1,
					 "fuckpartner.com" => 1,
					 "www.fuckpartner.com" => 1,
					 "fucktube.com" => 1,
					 "www.fucktube.com" => 1,
					 "gofuckyourself.com" => 1,
					 "www.gofuckyourself.com" => 1,
					 "vidsfucker.com" => 1,
					 "www.vidsfucker.com" => 1,
					 "whatthefuckhasobamadonesofar.com" => 1,
					 "www.whatthefuckhasobamadonesofar.com" => 1,
					 "adultfriendfinder.com" => 1,
					 "www.adultfriendfinder.com" => 1,
					 "xvideos.com" => 1,
					 "www.xvideos.com" => 1,
					 "pornhub.com" => 1,
					 "www.pornhub.com" => 1,
					 "xhamster.com" => 1,
					 "www.xhamster.com" => 1,
					 "youporn.com" => 1,
					 "www.youporn.com" => 1,
					 "tube8.com" => 1,
					 "www.tube8.com" => 1,
					 "xnxx.com" => 1,
					 "www.xnxx.com" => 1,
					 "youjizz.com" => 1,
					 "www.youjizz.com" => 1,
					 "xvideoslive.com" => 1,
					 "www.xvideoslive.com" => 1,
					 "spankwire.com" => 1,
					 "www.spankwire.com" => 1,
					 "hardsextube.com" => 1,
					 "www.hardsextube.com" => 1,
					 "keezmovies.com" => 1,
					 "www.keezmovies.com" => 1,
					 "tnaflix.com" => 1,
					 "www.tnaflix.com" => 1,
					 "megaporn.com" => 1,
					 "www.megaporn.com" => 1,
					 "cam4.com" => 1,
					 "www.cam4.com" => 1,
					 "slutload.com" => 1,
					 "www.slutload.com" => 1,
					 "empflix.com" => 1,
					 "www.empflix.com" => 1,
					 "pornhublive.com" => 1,
					 "www.pornhublive.com" => 1,
					 "youjizzlive.com" => 1,
					 "www.youjizzlive.com" => 1,
					 "pornhost.com" => 1,
					 "www.pornhost.com" => 1,
					 "redtube.com" => 1,
					 "www.redtube.com" => 1
					 );


function isDev() {
	global $gbDev;
	return $gbDev;
}


// Return an array of the archive names.
function archiveNames() {
	global $gPagesTable, $gbDev, $ghHiddenArchives;

	$aNames = array();
	$query = "select archive from $gPagesTable group by archive order by archive asc;";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$archive = $row['archive'];
		if ( $gbDev || !array_key_exists($archive, $ghHiddenArchives) ) {
			array_push($aNames, $archive);
		}
	}
	mysql_free_result($result);

	return $aNames;
}


// Return HTML to create a select list of archive labels (eg, "Oct 2010", "Nov 2010").
function selectArchiveLabel($archive, $curLabel, $bReverse=true, $bOnchage = true) {
	global $gPagesTable, $gDateRange;

	$sSelect = "<select" .
		( $bOnchage ? " onchange='document.location=\"?a=$archive&l=\"+escape(this.options[this.selectedIndex].value)'" : "" ) .
		">\n";

	$query = "select label, startedDateTime from $gPagesTable where $gDateRange and archive = '$archive' group by label order by startedDateTime " . 
		( $bReverse ? "desc" : "asc" ) . ";";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$label = $row['label'];
		$epoch = $row['startedDateTime'];
		$sSelect .= "  <option value='$label'" . ( $curLabel == $label ? " selected" : "" ) . "> $label\n";
	}

	$sSelect .= "</select>\n";

	return $sSelect;
}


// Return HTML to create a select list of archive labels (eg, "Oct 2010", "Nov 2010").
function selectSiteLabel($url, $curLabel="", $bReverse=true) {
	global $gPagesTable, $gDateRange;

	$sSelect = "<select class=selectSite onchange='document.location=\"?u=" . urlencode($url) . "&l=\" + escape(this.options[this.selectedIndex].value)'>\n";

	$query = "select label, startedDateTime from $gPagesTable where $gDateRange and url = '$url' group by label order by startedDateTime " . 
		( $bReverse ? "desc" : "asc" ) . ";";
	$result = doQuery($query);
	while ($row = mysql_fetch_assoc($result)) {
		$label = $row['label'];
		$epoch = $row['startedDateTime'];
		$sSelect .= "  <option value='$label'" . ( $curLabel == $label ? " selected" : "" ) . "> $label\n";
	}

	$sSelect .= "</select>\n";

	return $sSelect;
}


// Return an array of label names (in chrono order?) for an archive.
// If $bEpoch is true return labels based on 
function archiveLabels($archive = "All", $bEpoch = false, $format = "n/j/y" ) {
	global $gPagesTable, $gDateRange;

	$query = "select label, min(startedDateTime) as epoch from $gPagesTable where $gDateRange and archive = '$archive' group by label order by epoch asc;";
	$result = doQuery($query);
	$aLabels = array();
	while ($row = mysql_fetch_assoc($result)) {
		$label = $row['label'];
		$epoch = $row['epoch'];
		if ( $bEpoch ) {
			array_push($aLabels, gmdate($format, $epoch));
		}
		else {
			array_push($aLabels, $label);
		}
	}

	return $aLabels;
}


// Return the latest (most recent) label for an archive 
// based on when the pages in that label were analyzed.
function latestLabel($archive) {
	global $gPagesTable;

	if ( ! $archive ) {
		return "";
	}

	$query = "select label from $gPagesTable where archive = '$archive' group by label order by startedDateTime desc;";
	return doSimpleQuery($query);
}


// Return HTML to create a select list of data slices (All, intersection, Top 100, etc.)
function selectSlice($cur="", $onchange="") {
	global $gaSlices;

	$sSlice = "<select $onchange>";
	foreach($gaSlices as $aSlice) {
		$dbname = $aSlice[0];
		$uiname = $aSlice[1];
		$sSlice .= "<option value='$dbname'" . ( $dbname == $cur ? " selected" : "" ) . "> $uiname\n";
	}
	$sSlice .= "</select>\n";

	return $sSlice;
}


// return an array of URL "slices" 
function sliceNames($bUinames = false) {
	global $gaSlices;

	$aSlices = array();
	foreach($gaSlices as $aSlice) {
		$dbname = $aSlice[0];
		$uiname = $aSlice[1];
		$aSlices[] = ( $bUiname ? $uiname : $dbname );
	}

	return $aSlices;
}


function deviceNames() {
	global $gaDevices;
	return $gaDevices;
}


// Display a link (or not) to a URL.
function siteLink($url) {
	if ( onBlackList($url) ) {
		// no link, just url
		return shortenUrl($url);
	}
	else { 
		return "<a href='$url'>" . shortenUrl($url) . "</a>";
	}
}


// Return true if the specified URL (or a variation) is in the blacklist.
function onBlacklist($url) {
	global $ghBlackList;

	$bBlacklisted = true;

	// base blacklisting on hostname
	$aMatches = array();
	if ( $url && preg_match('/http[s]*:\/\/([^\/]*)/', $url, $aMatches) ) {
		$hostname = $aMatches[1];
		$bBlacklisted = array_key_exists($hostname, $ghBlackList);
	}

	return $bBlacklisted;
}


// Extract and convert the date string in mysql dump gzip files to a LOCAL epoch time.
function dumpfileEpochTime($filename) {
	global $ghMonths;

	if ( preg_match('/.*_([A-Z][a-z][a-z])_([0-9]+)_(2[0-9][0-9][0-9])\.gz/', $filename, $aMatches) ) {
		$month = $ghMonths[$aMatches[1]];
		$day = $aMatches[2];
		$year = $aMatches[3];
		$epoch = mktime(12, 0, 0, $month, $day, $year);
		return $epoch;
	}
	
	return null;
}


// Convert bytes to kB
function formatSize($num) {
	return round($num / 1024);
}


// add commas to a big number
function commaize($num) {
	$sNum = "$num";
	$len = strlen($sNum);

	if ( $len <= 3 ) {
		return $sNum;
	}

	return commaize(substr($sNum, 0, $len-3)) . "," . substr($sNum, $len-3);
}


$ghFieldColors = array(
					   "numurls" => "000000",
					   "onLoad" => "229942",
					   "renderStart" => "224499",
					   "PageSpeed" => "008000",
					   "reqTotal" => "15A50E", //B09542",
					   "reqHtml" => "3399CC", //3B356A",
					   "reqJS" => "E63C0B", //E94E19",
					   "reqCSS" => "840084", //007099",
					   "reqFlash" => "4B557A",
					   "reqImg" => "1515FF", //AA0033",
					   "bytesTotal" => "006600", //1D7D61",
					   "bytesHtml" => "014F78",
					   "bytesJS" => "982807", //7777CC",
					   "bytesCSS" => "400040", //B4B418",
					   "bytesImg" => "00009D", //CF557B",
					   "bytesFlash" => "222222",
					   "numDomains" => "AA0033"
					   );

$ghFieldUnits = array("onLoad" => "ms",
					  "renderStart" => "ms",
					  "bytesTotal" => "kB",
					  "bytesHtml" => "kB",
					  "bytesJS" => "kB",
					  "bytesCSS" => "kB",
					  "bytesFlash" => "kB",
					  "bytesImg" => "kB"
					  );

// Return the same color for a given database field.
function fieldColor($field) {
	global $ghFieldColors;

	return ( array_key_exists($field, $ghFieldColors) ? $ghFieldColors[$field] : "80C65A" );
}


// Return a pretty string mapped to a DB field.
function fieldTitle($field) {
	global $ghColumnTitles;

	return ( array_key_exists($field, $ghColumnTitles) ? $ghColumnTitles[$field] : $field );
}


// Return a pretty string mapped to a DB field.
function fieldUnits($field) {
	global $ghFieldUnits;

	return ( array_key_exists($field, $ghFieldUnits) ? $ghFieldUnits[$field] : "" );
}


// Logic to shorten a URL while retaining readability.
function shortenUrl($url) {
	$max = 48;

	if ( strlen($url) < $max ) {
		return $url;
	}

	// Strip the querystring.
	$iQueryString = strpos($url, "?");
	if ( $iQueryString ) {
		$url = substr($url, 0, $iQueryString);
	}

	if ( strlen($url) < $max ) {
		return $url;
	}

	$iDoubleSlash = strpos($url, "//");
	$iFirstSlash = strpos($url, "/", $iDoubleSlash+2);
	$iLastSlash = strrpos($url, "/");

	$sHostname = substr($url, 0, $iFirstSlash); // does NOT include trailing slash
	$sPath = substr($url, $iFirstSlash, $iLastSlash);
	$sFilename = substr($url, $iLastSlash);

	$url = $sHostname . "/..." . $sFilename;
	if ( strlen($url) < $max ) {
		// Add as much of the path as possible.
		$url = str_replace("/...", "/" . substr($sPath, 1, $max - strlen($url)) . "...", $url);
		return $url;
	}

	$url = substr($url, 0, $max-3) . "...";

	return $url;
}


function getHarFileContents($filename) {
	return file_get_contents($filename);
}


// Delete all rows related to a specific page.
function purgePage($pageid) {
	global $gPagesTable, $gRequestsTable;

	$cmd = "delete from $gPagesTable where pageid = $pageid;";
	doSimpleCommand($cmd);
	$cmd = "delete from $gRequestsTable where pageid = $pageid;";
	doSimpleCommand($cmd);
}


//
//
// MYSQL
//
//
function doSimpleCommand($cmd) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword, $new_link=true);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doSimpleCommand: $cmd");
		$result = mysql_query($cmd, $link);
		//mysql_close($link); // the findCorrelation code relies on the link not being closed
		if ( ! $result ) {
			dprint("ERROR in doSimpleCommand: '" . mysql_error() . "' for command: " . $cmd);
		}
	}
}


function doQuery($query) {
	global $gMysqlServer, $gMysqlDb, $gMysqlUsername, $gMysqlPassword;

	$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword, $new_link=true);
	if ( mysql_select_db($gMysqlDb) ) {
		//error_log("doQuery: $query");
		$result = mysql_query($query, $link);
		//mysql_close($link); // the findCorrelation code relies on the link not being closed
		if ( FALSE === $result ) {
			dprint("ERROR in doQuery: '" . mysql_error() . "' for query: " . $query);
		}
		return $result;
	}

	return null;
}


// return the first row
function doRowQuery($query) {
	$result = doQuery($query);
	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		mysql_free_result($result);
	}

	return $row;
}


// return the first value from the first row
function doSimpleQuery($query) {
	$value = NULL;
	$result = doQuery($query);

	if ( $result ) {
		$row = mysql_fetch_assoc($result);
		if ( $row ) {
			$aKeys = array_keys($row);
			$value = $row[$aKeys[0]];
		}
		mysql_free_result($result);
	}

	return $value;
}


function tableExists($tablename) {
	return ( $tablename == doSimpleQuery("show tables like '$tablename';") );
}


/*******************************************************************************
SCHEMA CHANGES:
  This is a record of changes to the schema and how the tables were updated 
  in place.

12/1/10 - Added the "pageid" index to requestsdev. 
  This made the aggregateStats function 10x faster during import.
  mysql> create index pageid on requestsdev (pageid);

7/21/2011 - Added the "rank" column to pages table:
  mysql> alter table pagesdev add column rank int(10) unsigned after PageSpeed;
*******************************************************************************/
function createTables() {
	global $gPagesTable, $gRequestsTable, $gStatusTable, $gStatsTable, $gUrlsTable, $gSettingsTable;
	global $ghReqHeaders, $ghRespHeaders;

	if ( ! tableExists($gPagesTable) ) {
		$command = "create table $gPagesTable (" .
			"pageid int unsigned not null auto_increment" .
			", createDate int(10) unsigned not null" .
			", archive varchar (255) not null" .
			", label varchar (255) not null" .
			", harfile varchar (255)" .
			", wptid varchar (64) not null" .        // webpagetest.org id
			", wptrun int(2) unsigned not null" .    // webpagetest.org median #
			", title varchar (255) not null" .
			", url text" .
			", urlShort varchar (255)" .
			", urlHtml text" .
			", urlHtmlShort varchar (255)" .
			", startedDateTime int(10) unsigned" .
			", renderStart int(10) unsigned" .
			", onContentLoaded int(10) unsigned" .
			", onLoad int(10) unsigned" .
			", PageSpeed int(4) unsigned" .
			", rank int(10) unsigned" .

			", reqTotal int(4) unsigned not null" .
			", reqHtml int(4) unsigned not null" .
			", reqJS int(4) unsigned not null" .
			", reqCSS int(4) unsigned not null" .
			", reqImg int(4) unsigned not null" .
			", reqFlash int(4) unsigned not null" .
			", reqJson int(4) unsigned not null" .
			", reqOther int(4) unsigned not null" .

			", bytesTotal int(10) unsigned not null" .
			", bytesHtml int(10) unsigned not null" .
			", bytesJS int(10) unsigned not null" .
			", bytesCSS int(10) unsigned not null" .
			", bytesImg int(10) unsigned not null" .
			", bytesFlash int(10) unsigned not null" .
			", bytesJson int(10) unsigned not null" .
			", bytesOther int(10) unsigned not null" .

			", numDomains int(4) unsigned not null" .
			", primary key (pageid)" .
			", unique key (startedDateTime, harfile)" .
			");";
		doSimpleCommand($command);
	}

	if ( ! tableExists($gRequestsTable) ) {
		$sColumns = "";
		$aColumns = array_values($ghReqHeaders);
		sort($aColumns);
		for ( $i = 0; $i < count($aColumns); $i++ ) {
			$column = $aColumns[$i];
			$sColumns .= ", $column varchar (255)";
		}
		$aColumns = array_values($ghRespHeaders);
		sort($aColumns);
		for ( $i = 0; $i < count($aColumns); $i++ ) {
			$column = $aColumns[$i];
			$sColumns .= ", $column varchar (255)";
		}

		$command = "create table $gRequestsTable (" .
			"requestid int unsigned not null auto_increment" .
			", pageid int unsigned not null" .

			", startedDateTime int(10) unsigned" .
			", time int(10) unsigned" .
			", method varchar (32)" .
			", url text" .
			", urlShort varchar (255)" .
			", redirectUrl text" .
			", redirectUrlShort varchar (255)" .
			", firstReq tinyint(1) not null" .
			", firstHtml tinyint(1) not null" .

			// req
			", reqHttpVersion varchar (32)" .
			", reqHeadersSize int(10) unsigned" .
			", reqBodySize int(10) unsigned" .
			", reqCookieLen int(10) unsigned not null".
			", reqOtherHeaders text" .

			// response
			", status int(10) unsigned" .
			", respHttpVersion varchar (32)" .
			", respHeadersSize int(10) unsigned" .
			", respBodySize int(10) unsigned" .
			", respSize int(10) unsigned" .
			", respCookieLen int(10) unsigned not null".
			", mimeType varchar(255)" .
			", respOtherHeaders text" .

			// headers
			$sColumns .

			", primary key (requestid)" .
			", index(pageid)" .
			", unique key (startedDateTime, pageid, urlShort)" .
			");";
		doSimpleCommand($command);
	}

	// Create Status Table
	if ( ! tableExists($gStatusTable) ) {
		$command = "create table $gStatusTable (" .
			"statusid int unsigned not null auto_increment" .
			", url text" .
			", location varchar (32) not null" .
			", archive varchar (32) not null" .
			", label varchar (32) not null" .
			", status varchar (32) not null" .
			", timeOfLastChange int(10) unsigned not null" .
			", wptid varchar (64)" .
			", wptRetCode varchar (8)" .
			", medianRun int(4) unsigned" .
			", startRender int(10) unsigned" .
			", pagespeedScore int(4) unsigned" .
			", primary key (statusid)" .
			", index(statusid)" .
			");";
		doSimpleCommand($command);
	}

	if ( ! tableExists($gStatsTable) ) {
		$command = "create table $gStatsTable (" .
			"label varchar (32) not null" .           // "Oct 1 2011"
			", slice varchar (32) not null" .         // "Top100", "Top1000", "intersection", or "All"
			", device varchar (32) not null" .        // "iphone43", "isim", or "IE8"
			", version int(6) unsigned not null" .    // the SVN version # so we can track what values to recompute
			", numurls int unsigned" .       // even "Top100" might only be 98 URLs

			// averages across ALL SITES in the slice
			", PageSpeed float unsigned" .
			", numDomains float unsigned" .
			", reqTotal float unsigned" .
			", reqHtml float unsigned" .
			", reqJS float unsigned" .
			", reqCSS float unsigned" .
			", reqImg float unsigned" .
			", reqGif float unsigned" .
			", reqJpg float unsigned" .
			", reqPng float unsigned" .
			", reqFlash float unsigned" .
			", reqJson float unsigned" .
			", reqOther float unsigned" .
			", bytesTotal int(10) unsigned" .
			", bytesHtml int(10) unsigned" .
			", bytesJS int(10) unsigned" .     // eg, average total bytes of JS downloaded per page
			", bytesCSS int(10) unsigned" .
			", bytesImg int(10) unsigned" .
			", bytesGif int(10) unsigned" .
			", bytesJpg int(10) unsigned" .
			", bytesPng int(10) unsigned" .
			", bytesFlash int(10) unsigned" .
			", bytesJson int(10) unsigned" .
			", bytesOther int(10) unsigned" .

			// % of sites with at least one of these conditions
			", perRedirects int(4) unsigned" .
			", perErrors int(4) unsigned" .
			", perFlash int(4) unsigned" .
			", perGlibs int(4) unsigned" .
/*
			// % of sites that use this JS library
			", perjQuery float unsigned" .
			", perYUI float unsigned" .
			", perDojo float unsigned" .
			", perGA float unsigned" .
			", perQuantcast float unsigned" .
			", perAddThis float unsigned" .
			", perFacebook float unsigned" .
			", perGPlusOne float unsigned" .
			", perTwitter float unsigned" .
			", perShareThis float unsigned" .
*/
			// % of requests that are https
			", perHttps float unsigned" .

			// % of sites with max-age in this range
			// "maxage30" === maxage > 1 day AND maxage <= 30 days
			", maxageNull int(4) unsigned" .
			", maxage0 int(4) unsigned" .
			", maxage1 int(4) unsigned" .
			", maxage30 int(4) unsigned" .
			", maxage365 int(4) unsigned" .
			", maxageMore int(4) unsigned" .

			// correlation coefficients: top 5 correlations for onload and render
			", onLoadccf1 varchar (32)" .
			", onLoadccv1 float unsigned" .
			", onLoadccf2 varchar (32)" .
			", onLoadccv2 float unsigned" .
			", onLoadccf3 varchar (32)" .
			", onLoadccv3 float unsigned" .
			", onLoadccf4 varchar (32)" .
			", onLoadccv4 float unsigned" .
			", onLoadccf5 varchar (32)" .
			", onLoadccv5 float unsigned" .
			", renderStartccf1 varchar (32)" .
			", renderStartccv1 float unsigned" .
			", renderStartccf2 varchar (32)" .
			", renderStartccv2 float unsigned" .
			", renderStartccf3 varchar (32)" .
			", renderStartccv3 float unsigned" .
			", renderStartccf4 varchar (32)" .
			", renderStartccv4 float unsigned" .
			", renderStartccf5 varchar (32)" .
			", renderStartccv5 float unsigned" .

			", primary key (label, slice, device)" .
			");";
		doSimpleCommand($command);
	}

	// Create Urls Table
	if ( ! tableExists($gUrlsTable) ) {
		$command = "create table $gUrlsTable (" .
			"urlid int unsigned not null auto_increment" .
			", domain varchar (255)" .
			", url text" .
			", rank int(10) unsigned" .
			", primary key (urlid)" .
			", unique(domain)" .
			");";
		doSimpleCommand($command);
	}

	// Create Settings Table
	if ( ! tableExists($gSettingsTable) ) {
		$command = "create table $gSettingsTable (" .
			"setting varchar (64)" .
			", val varchar (255)" .
			", primary key (setting)" .
			");";
		doSimpleCommand($command);
	}
}


// Helper function to safely get QueryString (and POST) parameters.
function getParam($name, $default="") {
	global $gMysqlServer, $gMysqlUsername, $gMysqlPassword;

	if ( array_key_exists($name, $_GET) ) {
		$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword, $new_link=true);
		return mysql_real_escape_string($_GET[$name], $link);
	}
	else if ( array_key_exists($name, $_POST) ) {
		$link = mysql_connect($gMysqlServer, $gMysqlUsername, $gMysqlPassword, $new_link=true);
		return mysql_real_escape_string($_POST[$name], $link);
	}

	return $default;
}


// Escape ' and \ characters before inserting strings into MySQL.
function mysqlEscape($text) {
	return str_replace("'", "\\'", str_replace("\\", "\\\\", $text));
}


// Simple logging/debugging function.
function dprint($msg) {
	echo htmlspecialchars("DPRINT: $msg\n");
}

// Simple logging/debugging function.
function lprint($msg) {
	echo htmlspecialchars("$msg\n");
}


// like implode but works with a hash
// $separator is used between a key and value, eg, "="
function hashImplode( $glue, $separator, $hash, $quote="'" ) {
    if ( ! is_array( $hash ) ) {
		return $hash;
	}

    $aTuples = array();
    foreach ( $hash as $key => $val ) {
        $aTuples[] = ( is_numeric($val) ? "{$key}{$separator}{$val}" : "{$key}{$separator}{$quote}{$val}{$quote}" );
    }
    return implode( $glue, $aTuples );
}
?>
