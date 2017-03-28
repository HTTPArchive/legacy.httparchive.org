# BigQuery

## How to backfill the HTTP Archive BigQuery database from completed HAR dumps on Google Storage

1. Go to https://console.cloud.google.com and open the HTTP Archive project
2. Ensure the HAR dumps are available and marked as done
	- Storage console > Browser > httparchive
	- filter by [chrome,android] prefix > Month_DD_YYYY > done
3. Manually run the HAR sync script
	- Open cloud shell > SSH into worker:

	 	`gcloud compute --project "httparchive" ssh --zone "us-west1-b" "worker"`
	- (optional) Initialize your account and authenticate

		```
		gcloud auth login
		cp -R ../igrigorik/code code
	 	```
	- Run sync script

		`code/sync_har.sh [chrome,android] YYYY-MM-DD`
4. Monitor dataflow
	- Cloud Dataflow console > job with “Running” status
	- Monitor logs

		Typical job duration: ~45 minutes

## How to backfill the HTTP Archive BigQuery database from completed HAR dumps on Google Storage with a non-standard date (2016-12-02)

Before step 3c above, either:

1. Copy subdir of the non-standard date in Storage to a subdir with the standardized date:

	`gsutil -m cp -r gs://httparchive/android-Dec_2_2016 \ gs://httparchive/android-Dec_1_2016`

OR

1. Modify the sync_har.sh script to hardcode the import_date to the non-standard date:

	`import_date=$(date +"Dec_2_2016")`

2. Modify the BigQueryImport.java file to hardcode the date variable in getBigQueryOutput to the standardized date:

	`String date = "Dec_1_2016";`

The first approach standardizes the data in Google Storage but that alone takes 5-6 hours, despite the -m option to enable multithreading, in addition to the ~hour of backfilling. The second approach is super hacky but it’s just as fast as a regular backfill. TODO: Bake the hackiness into the script with parameters so that the BigQuery date can differ from the Storage date.
