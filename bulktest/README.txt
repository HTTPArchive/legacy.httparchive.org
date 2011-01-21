The newly added files in this directory include crawl.php, crawl_lib.inc,
bootstrap.inc.

1. bootstrap.inc: initialize the whole system.
2. crawl_lib.inc: the functions to achieve job scheduling
3. crawl.php: the main entry.

How to run the system?

1. To manully run it, go to bulktest/ dir, run "php crawl.php" repeatly until all the tests in
status table have statu code 5. All the errors are printed onto stdout via dprint. So if you
want to summarize/analyze the failures afterwards, you need redirect (append) the stdout out
to a debug file. The crawl.php in code base will do reload which means once all
the tests are finished on WPT server it will submit all the urls again. I have not implemented
a flag to explicitly disable/enable this. So if this is NOT the behavior you want, you need
comment out the line#45 in crawl.php (LoadUrlFromFile();) after the first time you run
crawl.php.

2. To autmatically run it, you can put it into crontab ... make sure you go into bulktest dir
to run the script. Otherwise, you will have path problem.


The list of the status code:

0: url is just loaded from the urls.txt file
1: url is submitted to wpt server and forms a test
2: the test is done on wpt server
3: xml result is generated, downloaded and parsed successfully
4: har file is generated, downloaded and parsed successfully
5: succeed

At the end, any tests that remain on an non-5 status code indicate a failure
case.
