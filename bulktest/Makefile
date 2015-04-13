gDesktopDir := /var/www/httparchive
gMobileDir := /var/www/httparchive.mobile
gDevDir := /var/www/httparchive.dev
gChromeDir := /var/www/httparchive.chrome
gEmulationDir := /var/www/httparchive.emulation

# We also have bulktest under the mobile directory
push :
	cp -p *.php *.inc .htaccess $(gDesktopDir)/bulktest/.

pushmobile :
	cp -p *.php *.inc .htaccess $(gMobileDir)/bulktest/.

pushchrome :
	cp -p *.php *.inc .htaccess $(gChromeDir)/bulktest/.

pushemulation :
	cp -p *.php *.inc .htaccess $(gEmulationDir)/bulktest/.

