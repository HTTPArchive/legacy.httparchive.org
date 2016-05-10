gDesktopDir := /var/www/httparchive
gMobileDir := /var/www/httparchive.mobile
gDevDir := /var/www/httparchive.dev
gChromeDir := /var/www/httparchive.chrome
gAndroidDir := /var/www/httparchive.android
gIphoneDir := /var/www/httparchive.iphone
gIeDir := /var/www/httparchive.ie

# We also have bulktest under the mobile directory
push :
	cp -p *.php *.inc .htaccess $(gDesktopDir)/bulktest/.

pushmobile :
	cp -p *.php *.inc .htaccess $(gMobileDir)/bulktest/.

pushchrome :
	cp -p *.php *.inc .htaccess $(gChromeDir)/bulktest/.

pushandroid :
	cp -p *.php *.inc .htaccess $(gAndroidDir)/bulktest/.

pushie :
	cp -p *.php *.inc .htaccess $(gIeDir)/bulktest/.

pushiphone :
	cp -p *.php *.inc .htaccess $(gIphoneDir)/bulktest/.

pushall: pushmobile pushchrome pushandroid pushie pushiphone
