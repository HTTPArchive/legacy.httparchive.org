gDesktopDir := /var/www/httparchive
gMobileDir := /var/www/httparchive.mobile
gDevDir := /var/www/httparchive.dev
gChromeDir := /var/www/httparchive.chrome
gAndroidDir := /var/www/httparchive.android
gIphoneDir := /var/www/httparchive.iphone
gIeDir := /var/www/httparchive.ie

# harviewer installation: http://code.google.com/p/harviewer/wiki/Installation 
# create "downloads" symlink back to /var/www/httparchive.dev/downloads

push :
	cp -p *.php *.inc *.js *.css favicon.ico apple-*.png robots.txt $(gDesktopDir)/.
	/bin/rm $(gDesktopDir)/admin.php
	mkdir -p $(gDesktopDir)/images
	cp -p images/*.* $(gDesktopDir)/images/.
	mkdir -p $(gDesktopDir)/lists
	cp -p lists/*.txt $(gDesktopDir)/lists/.
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/harviewer harviewer"

pushmobile :
	cp -p *.php *.inc *.js *.css favicon.ico apple-*.png robots.txt $(gMobileDir)/.
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
	echo "CVSNO: ln -s $(gDevDir)/harviewer harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"

pushchrome :
	cp -p *.php *.inc *.js *.css favicon.ico apple-*.png robots.txt $(gChromeDir)/.
	/bin/rm $(gChromeDir)/admin.php
	/bin/rm $(gChromeDir)/addsite.php
	/bin/rm $(gChromeDir)/removesite.php
	mkdir -p $(gChromeDir)/images
	cp -p images/*.* $(gChromeDir)/images/.
	mkdir -p $(gChromeDir)/lists
	cp -p lists/*.txt $(gChromeDir)/lists/.
	mkdir -p $(gChromeDir)/harfiles-delme
	ls -l $(gChromeDir)/har_to_pagespeed
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/harviewer harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"

pushandroid :
	cp -p *.php *.inc *.js *.css favicon.ico apple-*.png robots.txt $(gAndroidDir)/.
	/bin/rm $(gAndroidDir)/admin.php
	/bin/rm $(gAndroidDir)/addsite.php
	/bin/rm $(gAndroidDir)/removesite.php
	mkdir -p $(gAndroidDir)/images
	cp -p images/*.* $(gAndroidDir)/images/.
	mkdir -p $(gAndroidDir)/lists
	cp -p lists/*.txt $(gAndroidDir)/lists/.
	mkdir -p $(gAndroidDir)/harfiles-delme
	ls -l $(gAndroidDir)/har_to_pagespeed
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/harviewer harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"

pushiphone :
	cp -p *.php *.inc *.js *.css favicon.ico apple-*.png robots.txt $(gIphoneDir)/.
	/bin/rm $(gIphoneDir)/admin.php
	/bin/rm $(gIphoneDir)/addsite.php
	/bin/rm $(gIphoneDir)/removesite.php
	mkdir -p $(gIphoneDir)/images
	cp -p images/*.* $(gIphoneDir)/images/.
	mkdir -p $(gIphoneDir)/lists
	cp -p lists/*.txt $(gIphoneDir)/lists/.
	mkdir -p $(gIphoneDir)/harfiles-delme
	ls -l $(gIphoneDir)/har_to_pagespeed
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/harviewer harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"

pushie :
	cp -p *.php *.inc *.js *.css favicon.ico apple-*.png robots.txt $(gIeDir)/.
	/bin/rm $(gIeDir)/admin.php
	/bin/rm $(gIeDir)/addsite.php
	/bin/rm $(gIeDir)/removesite.php
	mkdir -p $(gIeDir)/images
	cp -p images/*.* $(gIeDir)/images/.
	mkdir -p $(gIeDir)/lists
	cp -p lists/*.txt $(gIeDir)/lists/.
	mkdir -p $(gIeDir)/harfiles-delme
	ls -l $(gIeDir)/har_to_pagespeed
	echo "push .htaccess!"
	echo "CVSNO: ln -s $(gDevDir)/harviewer harviewer"
	echo "CVSNO: har_to_pagespeed and harfiles-delme"

pushall: push pushmobile pushchrome pushandroid pushiphone pushie

pushmetrics :
	mv /var/www/webpagetest/www/settings/custom_metrics/*.js /tmp/.
	cp -p custom_metrics/*.js /var/www/webpagetest/www/settings/custom_metrics/.
