gDesktopDir := /var/www/httparchive
gMobileDir := /var/www/httparchive.mobile
gDevDir := /var/www/httparchive.dev

# We also have bulktest under the mobile directory
push :
	cp -p *.php *.inc .htaccess $(gDesktopDir)/bulktest/.

pushmobile :
	cp -p *.php *.inc .htaccess $(gMobileDir)/bulktest/.

