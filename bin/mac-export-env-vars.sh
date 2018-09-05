#! /bin/bash

export DB_HOST=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sotah-infra_db_1`
export NATS_HOST=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sotah-infra_nats_1`
export NATS_PORT=4222
export APP_PORT=8080
