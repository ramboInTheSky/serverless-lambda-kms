#!/bin/sh
trap "exit 1" INT

docker-compose -f ../docker/sqs/docker-compose.yml up -d
sls offline start --stage local --region=eu-west-2
