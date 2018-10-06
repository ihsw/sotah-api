$Env:DB_HOST = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sotah-infra_db-dev_1
$Env:NATS_HOST = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sotah-infra_nats_1
$Env:NATS_PORT = 4222
$Env:APP_PORT = 8080
Write-Output "wew lad"