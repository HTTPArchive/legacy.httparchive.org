push :
	cp -p stealth.php ~/httparchive.org/index.php
	cp -p ui.php favicon.ico ~/httparchive.org/.
	mkdir -p ~/httparchive.org/images
	cp -p images/httparchive-49x47.png ~/httparchive.org/images/.
	echo "PUSH .htaccess MANUALLY IF YOU WANT!!"

pushbeta :
	mkdir -p ~/beta.httparchive.org
	cp -p *.php settings.inc *.js *.css favicon.ico har_to_pagespeed .htaccess ~/beta.httparchive.org/.
	mkdir -p ~/beta.httparchive.org/images
	cp -p images/*.* ~/beta.httparchive.org/images/.
	mkdir -p ~/beta.httparchive.org/lists
	cp -p lists/*.txt ~/beta.httparchive.org/lists/.
	mkdir -p ~/beta.httparchive.org/archives
	cp -pRu archives ~/beta.httparchive.org/.
	cd ~/beta.httparchive.org/
	echo "CREATE interesting.js.cache !!!!!!!!!!!"
