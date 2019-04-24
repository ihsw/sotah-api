#! /bin/bash

# us-central1 because us-east1 does not fucking have go111 runtime yet

# deploying func
gcloud beta functions deploy test \
    --runtime nodejs10 \
    --trigger-topic test \
    --source ./dist \
    --memory 128MB \
    --region us-central1
