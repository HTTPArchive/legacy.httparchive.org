push :
	cp -p *.php *.inc *.js *.css favicon.ico robots.txt ~/httparchive.org/.
	/bin/rm ~/httparchive.org/admin.php
	mkdir -p ~/httparchive.org/images
	cp -p images/*.* ~/httparchive.org/images/.
	mkdir -p ~/httparchive.org/lists
	cp -p lists/*.txt ~/httparchive.org/lists/.
	mkdir -p ~/httparchive.org/downloads
	cp -pu downloads/*.gz ~/httparchive.org/downloads/.
	echo "push .htaccess!"
	echo "CVSNO: ln -s ~/dev.httparchive.org/aaa/harviewer/webapp harviewer"

pushmobile :
	cp -p *.php *.inc *.js *.css favicon.ico robots.txt ~/mobile.httparchive.org/.
	/bin/rm ~/mobile.httparchive.org/admin.php
	/bin/rm ~/mobile.httparchive.org/addsite.php
	/bin/rm ~/mobile.httparchive.org/removesite.php
	mkdir -p ~/mobile.httparchive.org/images
	cp -p images/*.* ~/mobile.httparchive.org/images/.
	mkdir -p ~/mobile.httparchive.org/lists
	cp -p lists/*.txt ~/mobile.httparchive.org/lists/.
	mkdir -p ~/mobile.httparchive.org/downloads
	cp -pu downloads/*.gz ~/mobile.httparchive.org/downloads/.
	echo "push .htaccess!"
	echo "CVSNO: ln -s ~/dev.httparchive.org/aaa/harviewer/webapp harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"

pushbeta :
	mkdir -p ~/beta.httparchive.org
	cp -p *.php *.inc *.js *.css favicon.ico robots.txt .htaccess ~/beta.httparchive.org/.
	/bin/rm ~/beta.httparchive.org/admin.php
	mkdir -p ~/beta.httparchive.org/images
	cp -p images/*.* ~/beta.httparchive.org/images/.
	mkdir -p ~/beta.httparchive.org/lists
	cp -p lists/*.txt ~/beta.httparchive.org/lists/.
	mkdir -p ~/beta.httparchive.org/downloads
	cp -pu downloads/*.gz ~/beta.httparchive.org/downloads/.
	echo "CVSNO: ln -s ~/dev.httparchive.org/aaa/harviewer/webapp harviewer"
