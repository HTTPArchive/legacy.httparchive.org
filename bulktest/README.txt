!! DO NOT USE !!
!! Bulktest is not currently supported for use outside of the HTTP Archive. 
!! Issue #154 (http://code.google.com/p/httparchive/issues/detail?id=154) 
!! exists to add support for bulktest.
!! DO NOT USE !!

The description of included files:

bootstrap.inc: Configure the environment of execution
batch_lib: The collection of all the functions needed by batch testing
batch_start: Start a new batch testing
batch_process: Peform all the tasks of a batch testing

How to make the batch running?

a) run "php batch_start" to kick off a new batch testing. It will detect
whether there is a batch testing running in the system. If there is, it
will kill it. It will read the input URL file, create the MySQL tables
if necessary and the corresponding records. It will also print a summary
of the previous batch testing before starting a new batch.

b) run "php batch_process" repeatly to perform a single batch testing. In
each run, the script forks some subprocesses each of which is in charge of
the tests in a specified status and try to move all the tests in this
status to the next step. Once upon a completion of running, a summary of
the batch will be printed. This script also guarantees that there is no
other instance running when it starts. If there is, it exits.

To automate the whole periodic batch testing, you could schedule 
batch_process.php to run hourly in cron - if there's nothing to do it just
exits. batch_start.php could be triggered manually or scheduled in cron to
run every 2 weeks or whatever the interval for testing would be.
