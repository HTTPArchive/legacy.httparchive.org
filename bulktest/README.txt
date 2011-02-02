The newly added files in this directory include crawl.php, crawl_lib.inc,
bootstrap.inc.

1. bootstrap.inc: initialize the crawler.
2. crawl_lib.inc: the functions to perform crawling.
3. crawl.php: the main entry.

How to run the system? simple, run "php crawl.php"

1. The script should be put it into crontab and automatically get repeatedly executed. The 
current code does not have a loop to wait until all the tests are done or dead permanently. 
But you can still manually run it (see below). Make sure you enter bulktest dir
to run the script when setting up the cronjob; Otherwise, you might run into some path problem.

2. To manully run it, go to bulktest/ dir, run "php crawl.php". You need run it several times
to make all the results in the place. At the end of each run, the script will print a summary 
of the status of all the tests you submit to stdout. Also all the access errors (e.g., http 
status 404) will be printed on stdout. So if you want to summarize/analyze the failures afterwards,
you need redirect (append) the stdout out to a debug file. So eventually, you can track all the
failure cases (http access errors + procedure errors like some tests stuck in a intermediate status).

3. There is a global variable defined in bulktest/bootstrap.inc which is assigned by value 0. If you
want the urls in the input file to be loaded repeatedly (like what http archive does) once all
the tests are finished on WPT server in the previous batch, set it to a non-zero value. 

The list of the status code:

0: url is just loaded from the urls.txt file
1: url is submitted to wpt server and forms a test
2: the test is done on wpt server
3: xml result is generated, downloaded and parsed successfully
4: har file is generated, downloaded
5: the info of har file is successfully parsed and inserted into the tabls
