gDesktopDir := /var/www/httparchive
gMobileDir := /var/www/httparchive.mobile
gDevDir := /var/www/httparchive.dev

# harviewer installation: http://code.google.com/p/harviewer/wiki/Installation
# create "downloads" symlink back to /var/www/httparchive.dev/downloads

push :
	cp -p *.php *.inc *.js *.css favicon.ico robots.txt $(gDesktopDir)/.
	/bin/rm $(gDesktopDir)/admin.php
	mkdir -p $(gDesktopDir)/images
	cp -p images/*.* $(gDesktopDir)/images/.
	mkdir -p $(gDesktopDir)/lists
	cp -p lists/*.txt $(gDesktopDir)/lists/.
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/aaa/harviewer/webapp harviewer"

pushmobile :
	cp -p *.php *.inc *.js *.css favicon.ico robots.txt $(gMobileDir)/.
	/bin/rm $(gMobileDir)/admin.php
	/bin/rm $(gMobileDir)/addsite.php
	/bin/rm $(gMobileDir)/removesite.php
	mkdir -p $(gMobileDir)/images
	cp -p images/*.* $(gMobileDir)/images/.
	mkdir -p $(gMobileDir)/lists
	cp -p lists/*.txt $(gMobileDir)/lists/.
	mkdir -p $(gMobileDir)/harfiles-delme
	ls -l $(gMobileDir)/har_to_pagespeed
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/aaa/harviewer/webapp harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"
