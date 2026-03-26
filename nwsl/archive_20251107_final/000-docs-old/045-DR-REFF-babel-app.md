# Fabulae - Babel: a UX for the Babel service

The UX invokes, displays, retrieves, plays, but does not generate.

For generation of audio, use the Babel Go service in conjunction with this UX.


# Deploy with Cloud Run

## using Environment variables 

```
export SA_ID=your-service-account@your-google-cloud-project-id.iam.gserviceaccount.com
export PROJECT_ID=$(gcloud config get project)
export GENMEDIA_BUCKET=your-bucket
export BABEL_ENDPOINT=https://babel-fabulae-1234.us-central1.run.app 
```

```
gcloud run deploy babel-ux --source . --allow-unauthenticated  --region us-central1   --service-account $SA_ID   --update-env-vars=BABEL_ENDPOINT=${BABEL_ENDPOINT} --update-env-vars=PROJECT_ID=${PROJECT_ID} --update-env-vars=GENMEDIA_BUCKET=${GENMEDIA_BUCKET}
```

## using an .env file

or, alternatively, `.env` file (see `envfile.example` for a template)

```
#BABEL_ENDPOINT=http://localhost:8080
BABEL_ENDPOINT=https://babel-fabulae-123.us-central1.run.app
PROJECT_ID=your-google-cloud-project-id
LOCATION=us-central1
GENMEDIA_BUCKET=your-bucket # no gs:// prefix
```


```
gcloud run deploy babel-ux --source . --allow-unauthenticated  --region us-central1   --service-account $SA_ID   --update-env-vars=BABEL_ENDPOINT=${BABEL_ENDPOINT} --update-env-vars=PROJECT_ID=${PROJECT_ID} --update-env-vars=GENMEDIA_BUCKET=${GENMEDIA_BUCKET}
```