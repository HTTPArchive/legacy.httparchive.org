/**
 * IMPORTANT: Do not modify this file directly! It is generated by
 *   bin/cms-detector.js
 *
 * Detects the presence of Content Management Systems.
 *
 *
 * Built on https://github.com/AliasIO/Wappalyzer.
 * See https://github.com/AliasIO/Wappalyzer/blob/master/LICENSE.
 */

const cmsList = [{"name":"1C-Bitrix","html":"(?:<link[^>]+components/bitrix|(?:src|href)=\"/bitrix/(?:js|templates))","script":"1c-bitrix"},{"name":"2z Project","meta":{"generator":"2z project ([\\d.]+)\\;version:\\1"}},{"name":"3dCart","script":"(?:twlh(?:track)?\\.asp|3d_upsell\\.js)"},{"name":"Accessible Portal","meta":{"generator":"Accessible Portal"}},{"name":"Adobe Experience Manager","html":["<div class=\"[^\"]*parbase","<div[^>]+data-component-path=\"[^\"+]jcr:"],"script":"/etc/designs/"},{"name":"Ametys","meta":{"generator":"(?:Ametys|Anyware Technologies)"},"script":"ametys\\.js"},{"name":"Amiro.CMS","meta":{"generator":"Amiro"}},{"name":"Apostrophe CMS","html":"<[^>]+data-apos-refreshable[^>]"},{"name":"AsciiDoc","meta":{"generator":"^AsciiDoc ([\\d.]+)\\;version:\\1"}},{"name":"BIGACE","html":"(?:Powered by <a href=\"[^>]+BIGACE|<!--\\s+Site is running BIGACE)","meta":{"generator":"BIGACE ([\\d.]+)\\;version:\\1"}},{"name":"Backdrop","meta":{"generator":"Backdrop CMS(?: (\\d))?\\;version:\\1"}},{"name":"Banshee","html":"Built upon the <a href=\"[^>]+banshee-php\\.org/\">[a-z]+</a>(?:v([\\d.]+))?\\;version:\\1","meta":{"generator":"Banshee PHP"}},{"name":"Bolt","meta":{"generator":"Bolt"}},{"name":"BrowserCMS","meta":{"generator":"BrowserCMS ([\\d.]+)\\;version:\\1"}},{"name":"Business Catalyst","html":"<!-- BC_OBNW -->","script":"CatalystScripts"},{"name":"CMS Made Simple","meta":{"generator":"CMS Made Simple"}},{"name":"CMSimple","meta":{"generator":"CMSimple( [\\d.]+)?\\;version:\\1"}},{"name":"CPG Dragonfly","meta":{"generator":"CPG Dragonfly"}},{"name":"Cargo","html":"<link [^>]+Cargo feed","meta":{"cargo_title":""},"script":"/cargo\\."},{"name":"Chameleon","meta":{"generator":"chameleon-cms"}},{"name":"Concrete5","meta":{"generator":"concrete5 - ([\\d.ab]+)\\;version:\\1"},"script":"concrete/js/"},{"name":"Contao","html":["<!--[^>]+powered by (?:TYPOlight|Contao)[^>]*-->","<link[^>]+(?:typolight|contao)\\.css"],"meta":{"generator":"^Contao Open Source CMS$"}},{"name":"Contenido","meta":{"generator":"Contenido ([\\d.]+)\\;version:\\1"}},{"name":"Contens","meta":{"generator":"Contensis CMS Version ([\\d.]+)\\;version:\\1"}},{"name":"ContentBox","meta":{"generator":"ContentBox powered by ColdBox"}},{"name":"Cotonti","meta":{"generator":"Cotonti"}},{"name":"DM Polopoly","html":"<(?:link [^>]*href|img [^>]*src)=\"/polopoly_fs/"},{"name":"DNN","html":["<!-- by DotNetNuke Corporation","<!-- DNN Platform"],"meta":{"generator":"DotNetNuke"},"script":["/js/dnncore\\.js","/js/dnn\\.js"]},{"name":"DTG","html":["<a[^>]+Site Powered by DTG"]},{"name":"Danneo CMS","meta":{"generator":"Danneo CMS ([\\d.]+)\\;version:\\1"}},{"name":"DataLife Engine","meta":{"generator":"DataLife Engine"}},{"name":"DedeCMS","script":"dedeajax"},{"name":"DovetailWRP","html":"<link[^>]* href=\"\\/DovetailWRP\\/","script":"\\/DovetailWRP\\/"},{"name":"Drupal","html":"<(?:link|style)[^>]+sites/(?:default|all)/(?:themes|modules)/","meta":{"generator":"Drupal(?:\\s([\\d.]+))?\\;version:\\1"},"script":"drupal\\.js"},{"name":"Dynamicweb","meta":{"generator":"Dynamicweb ([\\d.]+)\\;version:\\1"}},{"name":"EPiServer","meta":{"generator":"EPiServer"}},{"name":"Eleanor CMS","meta":{"generator":"Eleanor"}},{"name":"FlexCMP","html":"<!--[^>]+FlexCMP[^>v]+v\\. ([\\d.]+)\\;version:\\1","meta":{"generator":"FlexCMP"}},{"name":"Fork CMS","meta":{"generator":"^Fork CMS$"}},{"name":"GX WebManager","html":"<!--\\s+Powered by GX","meta":{"generator":"GX WebManager(?: ([\\d.]+))?\\;version:\\1"}},{"name":"GetSimple CMS","meta":{"generator":"GetSimple"}},{"name":"Graffiti CMS","meta":{"generator":"Graffiti CMS ([^\"]+)\\;version:\\1"},"script":"/graffiti\\.js"},{"name":"Grav","meta":{"generator":"GravCMS(?:\\s([\\d.]+))?\\;version:\\1"}},{"name":"Green Valley CMS","html":"<img[^>]+/dsresource\\?objectid=","meta":{"DC.identifier":"/content\\.jsp\\?objectid="}},{"name":"Hippo","html":"<[^>]+/binaries/(?:[^/]+/)*content/gallery/"},{"name":"Hotaru CMS","meta":{"generator":"Hotaru CMS"}},{"name":"Hugo","meta":{"generator":"Hugo ([\\d.]+)?\\;version:\\1"}},{"name":"ImpressCMS","meta":{"generator":"ImpressCMS"},"script":"include/linkexternal\\.js"},{"name":"ImpressPages","meta":{"generator":"ImpressPages(?: CMS)?( [\\d.]*)\\;version:\\1"}},{"name":"InProces","html":"<!-- CSS InProces Portaal default -->","script":"brein/inproces/website/websitefuncties\\.js"},{"name":"Indexhibit","html":"<(?:link|a href) [^>]+ndxz-studio","meta":{"generator":"Indexhibit"}},{"name":"Indico","html":"Powered by\\s+(?:CERN )?<a href=\"http://(?:cdsware\\.cern\\.ch/indico/|indico-software\\.org|cern\\.ch/indico)\">(?:CDS )?Indico( [\\d\\.]+)?\\;version:\\1"},{"name":"InstantCMS","meta":{"generator":"InstantCMS"}},{"name":"Jalios","meta":{"generator":"Jalios"}},{"name":"Jekyll","meta":{"generator":"Jekyll (v[\\d.]+)?\\;version:\\1"}},{"name":"Joomla","html":"(?:<div[^>]+id=\"wrapper_r\"|<[^>]+(?:feed|components)/com_|<table[^>]+class=\"pill)\\;confidence:50","meta":{"generator":"Joomla!(?: ([\\d.]+))?\\;version:\\1"}},{"name":"Kentico CMS","meta":{"generator":"Kentico CMS ([\\d.R]+ \\(build [\\d.]+\\))\\;version:\\1"}},{"name":"Koala Framework","html":"<!--[^>]+This website is powered by Koala Web Framework CMS","meta":{"generator":"^Koala Web Framework CMS"}},{"name":"Koken","html":["<html lang=\"en\" class=\"k-source-essays k-lens-essays\">","<!--\\s+KOKEN DEBUGGING"],"meta":{"generator":"Koken ([\\d.]+)\\;version:\\1"},"script":"koken(?:\\.js\\?([\\d.]+)|/storage)\\;version:\\1"},{"name":"Kolibri CMS","meta":{"generator":"Kolibri"}},{"name":"Komodo CMS","meta":{"generator":"^Komodo CMS"}},{"name":"Koobi","html":"<!--[^K>-]+Koobi ([a-z\\d.]+)\\;version:\\1","meta":{"generator":"Koobi"}},{"name":"Kooboo CMS","script":"/Kooboo"},{"name":"Kotisivukone","script":"kotisivukone(?:\\.min)?\\.js"},{"name":"LEPTON","meta":{"generator":"LEPTON"}},{"name":"LightMon Engine","html":"<!-- Lightmon Engine Copyright Lightmon","meta":{"generator":"LightMon Engine"}},{"name":"Lithium","html":" <a [^>]+Powered by Lithium"},{"name":"Locomotive","html":"<link[^>]*/sites/[a-z\\d]{24}/theme/stylesheets"},{"name":"MODX","html":["<a[^>]+>Powered by MODX</a>","<(?:link|script)[^>]+assets/snippets/\\;confidence:20","<form[^>]+id=\"ajaxSearch_form\\;confidence:20","<input[^>]+id=\"ajaxSearch_input\\;confidence:20"],"meta":{"generator":"MODX[^\\d.]*([\\d.]+)?\\;version:\\1"}},{"name":"Mambo","meta":{"generator":"Mambo"}},{"name":"MaxSite CMS","meta":{"generator":"MaxSite CMS"}},{"name":"Medium","script":"medium\\.com"},{"name":"Melis CMS V2","html":"<!-- Rendered with Melics CMS V2","meta":{"powered-by":"^Melis CMS"}},{"name":"Methode","html":"<!-- Methode uuid: \"[a-f\\d]+\" ?-->","meta":{"eomportal-id":"\\d+","eomportal-instanceid":"\\d+","eomportal-lastUpdate":"","eomportal-loid":"[\\d.]+","eomportal-uuid":"[a-f\\d]+"}},{"name":"Microsoft SharePoint","meta":{"generator":"Microsoft SharePoint"}},{"name":"Moguta.CMS","html":"(?:<script|link)[^>]*mg-(?:core|plugins|templates)"},{"name":"Mono.net","script":"monotracker(?:\\.min)?\\.js"},{"name":"MotoCMS","html":"<link [^>]*href=\"[^>]*\\/mt-content\\/[^>]*\\.css","script":".*\\/mt-includes\\/[asetj]{2,6}\\/.*\\.js.*"},{"name":"Movable Type","meta":{"generator":"Movable Type"}},{"name":"Mozard Suite","meta":{"author":"Mozard"}},{"name":"Mura CMS","meta":{"generator":"Mura CMS ([\\d]+)\\;version:\\1"}},{"name":"Mynetcap","meta":{"generator":"Mynetcap"}},{"name":"Octopress","html":"Powered by <a href=\"http://octopress.org\">","meta":{"generator":"Octopress"}},{"name":"Odoo","html":"<link[^>]* href=[^>]+/web/css/(?:web\\.assets_common/|website\\.assets_frontend/)\\;confidence:25","meta":{"generator":"Odoo"},"script":"/web/js/(?:web\\.assets_common/|website\\.assets_frontend/)\\;confidence:25"},{"name":"OpenCms","html":"<link href=\"/opencms/","script":"opencms"},{"name":"OpenNemas","meta":{"generator":"OpenNemas"}},{"name":"OpenText Web Solutions","html":"<!--[^>]+published by Open Text Web Solutions"},{"name":"Ophal","meta":{"generator":"Ophal(?: (.*))? \\(ophal\\.org\\)\\;version:\\1"},"script":"ophal\\.js"},{"name":"Orchard CMS","meta":{"generator":"Orchard"}},{"name":"PANSITE","meta":{"generator":"PANSITE"}},{"name":"PHP-Fusion","html":"Powered by <a href=\"[^>]+php-fusion"},{"name":"PHP-Nuke","html":"<[^>]+Powered by PHP-Nuke","meta":{"generator":"PHP-Nuke"}},{"name":"Pagekit","meta":{"generator":"Pagekit"}},{"name":"Percussion","html":"<[^>]+class=\"perc-region\"","meta":{"generator":"(?:Percussion|Rhythmyx)"}},{"name":"Pligg","html":"<span[^>]+id=\"xvotes-0","meta":{"generator":"Pligg"}},{"name":"Plone","meta":{"generator":"Plone"}},{"name":"Posterous","html":"<div class=\"posterous"},{"name":"Proximis Omnichannel","html":"<html[^>]+data-ng-app=\"RbsChangeApp\"","meta":{"generator":"Proximis Omnichannel"}},{"name":"Quick.CMS","html":"<a href=\"[^>]+opensolution\\.org/\">CMS by","meta":{"generator":"Quick\\.CMS(?: v([\\d.]+))?\\;version:\\1"}},{"name":"RBS Change","html":"<html[^>]+xmlns:change=","meta":{"generator":"RBS Change"}},{"name":"RCMS","meta":{"generator":"^(?:RCMS|ReallyCMS)"}},{"name":"RiteCMS","meta":{"generator":"^RiteCMS(?: (.+))?\\;version:\\1"}},{"name":"Roadiz CMS","meta":{"generator":"^Roadiz ([a-z0-9\\s\\.]+) - \\;version:\\1"}},{"name":"RockRMS","meta":{"generator":"^Rock v.*"}},{"name":"S.Builder","meta":{"generator":"S\\.Builder"}},{"name":"SDL Tridion","html":"<img[^>]+_tcm\\d{2,3}-\\d{6}\\."},{"name":"SIMsite","meta":{"SIM.medium":""},"script":"/sim(?:site|core)/js"},{"name":"SPIP","meta":{"generator":"(?:^|\\s)SPIP(?:\\s([\\d.]+(?:\\s\\[\\d+\\])?))?\\;version:\\1"}},{"name":"Sarka-SPIP","meta":{"generator":"Sarka-SPIP(?:\\s([\\d.]+))?\\;version:\\1"}},{"name":"Serendipity","meta":{"Powered-By":"Serendipity v\\.(.+)\\;version:\\1","generator":"Serendipity"}},{"name":"SilverStripe","html":"Powered by <a href=\"[^>]+SilverStripe","meta":{"generator":"SilverStripe"}},{"name":"SiteEdit","meta":{"generator":"SiteEdit"}},{"name":"Sitecore","html":"<img[^>]+src=\"[^>]*/~/media/[^>]+\\.ashx"},{"name":"Sitefinity","meta":{"generator":"^Sitefinity (.+)$\\;version:\\1"}},{"name":"Sivuviidakko","meta":{"generator":"Sivuviidakko"}},{"name":"SmartSite","html":"<[^>]+/smartsite\\.(?:dws|shtml)\\?id=","meta":{"author":"Redacteur SmartInstant"}},{"name":"Solodev","html":"<div class=[\"']dynamicDiv[\"'] id=[\"']dd\\.\\d\\.\\d(?:\\.\\d)?[\"']>"},{"name":"Squiz Matrix","html":"<!--\\s+Running (?:MySource|Squiz) Matrix","meta":{"generator":"Squiz Matrix"}},{"name":"Subrion","meta":{"generator":"^Subrion "}},{"name":"TYPO3 CMS","html":"<(?:script[^>]+ src|link[^>]+ href)=[^>]+typo3temp/","meta":{"generator":"TYPO3\\s+(?:CMS\\s+)?([\\d.]+)?(?:\\s+CMS)?\\;version:\\1"}},{"name":"Textpattern CMS","meta":{"generator":"Textpattern"}},{"name":"Thelia","html":"<(?:link|style|script)[^>]+/assets/frontOffice/"},{"name":"TiddlyWiki","html":"<[^>]*type=[^>]text\\/vnd\\.tiddlywiki","meta":{"application-name":"^TiddlyWiki$","copyright":"^TiddlyWiki created by Jeremy Ruston","generator":"^TiddlyWiki$","tiddlywiki-version":"(.*)\\;version:\\1"}},{"name":"Tiki Wiki CMS Groupware","meta":{"generator":"^Tiki"},"script":"(?:/|_)tiki"},{"name":"Translucide","script":"lucide\\.init\\.js"},{"name":"Umbraco","html":"powered by <a href=[^>]+umbraco","meta":{"generator":"umbraco"}},{"name":"Ushahidi","script":"/js/ushahidi\\.js$"},{"name":"Vignette","html":"<[^>]+=\"vgn-?ext"},{"name":"WebGUI","meta":{"generator":"^WebGUI ([\\d.]+)\\;version:\\1"}},{"name":"WebPublisher","meta":{"generator":"WEB\\|Publisher"}},{"name":"WebsPlanet","meta":{"generator":"WebsPlanet"}},{"name":"WebsiteBaker","meta":{"generator":"WebsiteBaker"}},{"name":"Weebly","script":"cdn\\d+\\.editmysite\\.com"},{"name":"Wix","meta":{"X-Wix-Renderer-Server":""},"script":"static\\.wixstatic\\.com"},{"name":"Wolf CMS","html":"(?:<a href=\"[^>]+wolfcms\\.org[^>]+>Wolf CMS(?:</a>)? inside|Thank you for using <a[^>]+>Wolf CMS)"},{"name":"WordPress","html":["<link rel=[\"']stylesheet[\"'] [^>]+wp-(?:content|includes)","<link[^>]+s\\d+\\.wp\\.com"],"meta":{"generator":"WordPress( [\\d.]+)?\\;version:\\1"},"script":"/wp-includes/"},{"name":"XOOPS","meta":{"generator":"XOOPS"}},{"name":"XpressEngine","meta":{"generator":"XpressEngine"}},{"name":"a-blog cms","meta":{"generator":"a-blog cms"}},{"name":"actionhero.js","script":"actionheroClient\\.js"},{"name":"e107","script":"[^a-z\\d]e107\\.js"},{"name":"eSyndiCat","meta":{"generator":"^eSyndiCat "}},{"name":"eZ Publish","meta":{"generator":"eZ Publish"}},{"name":"io4 CMS","meta":{"generator":"GO[ |]+CMS Enterprise"}},{"name":"openEngine","meta":{"openEngine":""}},{"name":"papaya CMS","html":"<link[^>]*/papaya-themes/"},{"name":"phpSQLiteCMS","meta":{"generator":"^phpSQLiteCMS(?: (.+))?$\\;version:\\1"}},{"name":"phpwind","html":"Powered by <a href=\"[^\"]+phpwind\\.net","meta":{"generator":"^phpwind"}},{"name":"sNews","meta":{"generator":"sNews"}},{"name":"uCore","meta":{"generator":"uCore PHP Framework"}},{"name":"uKnowva","html":"<a[^>]+>Powered by uKnowva</a>","meta":{"generator":"uKnowva (?: ([\\d.]+))?\\;version:\\1"},"script":"/media/conv/js/jquery.js"},{"name":"viennaCMS","html":"powered by <a href=\"[^>]+viennacms"},{"name":"webEdition","meta":{"DC.title":"webEdition","generator":"webEdition"}}];

function checkHtml(html) {
	return !!document.body.innerHTML.match(html);
}

function checkScript(script) {
	return !!document.querySelector(`script[src*="${script}"]`)
}

function checkMeta(meta) {
	return Object.entries(meta).some(([attribute, value]) => {
		return !!document.querySelector(`meta[${attribute}*="${value}"]`);
	})
}

const cms = cmsList.reduce((cms, config) => {
	if (config.html && config.html.forEach) {
		config.html.forEach(html => {
			if (document.body.innerHTML.match(html)) {
				cms.add(config.name);
			}
		});
	}
	else if (config.html && config.html.push) {
		if (document.body.innerHTML.match(config.html)) {
			cms.add(config.name);
		}
	}
	if (config.script) {
		if (document.querySelector(`script[src*="${config.script}"]`)) {
			cms.add(config.name);
		}
	}
	return cms;
}, new Set());

return JSON.stringify(Array.from(cms));
