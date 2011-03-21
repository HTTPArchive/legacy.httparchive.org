push :
	cp -p *.php settings.inc *.js *.css favicon.ico har_to_pagespeed .htaccess ~/httparchive.org/.
	/bin/rm ~/httparchive.org/admin.php
	mkdir -p ~/httparchive.org/images
	cp -p images/*.* ~/httparchive.org/images/.
	mkdir -p ~/httparchive.org/lists
	cp -p lists/*.txt ~/httparchive.org/lists/.
	mkdir -p ~/httparchive.org/cache
	chmod 777 ~/httparchive.org/cache
	mkdir -p ~/httparchive.org/downloads
	cp -p downloads/*.gz ~/httparchive.org/downloads/.
	mkdir -p ~/httparchive.org/archives
	cp -pRu archives ~/httparchive.org/.
	echo "CREATE interesting.js.cache !!!!!!!!!!!"

pushbeta :
	mkdir -p ~/beta.httparchive.org
	cp -p *.php settings.inc *.js *.css favicon.ico har_to_pagespeed .htaccess ~/beta.httparchive.org/.
	/bin/rm ~/beta.httparchive.org/admin.php
	mkdir -p ~/beta.httparchive.org/images
	cp -p images/*.* ~/beta.httparchive.org/images/.
	mkdir -p ~/beta.httparchive.org/lists
	cp -p lists/*.txt ~/beta.httparchive.org/lists/.
	mkdir -p ~/beta.httparchive.org/cache
	chmod 777 ~/beta.httparchive.org/cache
	mkdir -p ~/beta.httparchive.org/downloads
	cp -p downloads/*.gz ~/beta.httparchive.org/downloads/.
	# use a symlink
	#mkdir -p ~/beta.httparchive.org/archives
	#cp -pRu archives ~/beta.httparchive.org/.
	#ln -s ~/dev.httparchive.org/archives ~/beta.httparchive.org/archives
	echo "CREATE interesting.js.cache !!!!!!!!!!!"
