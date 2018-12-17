#! /bin/bash

export DB_HOST=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sotahinfra_db_1`
export NATS_HOST=`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sotahinfra_nats_1`
export NATS_PORT=4222
export APP_PORT=9999
export TYPEORM_HOST=$DB_HOST
