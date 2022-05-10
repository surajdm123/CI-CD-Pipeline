#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
# set -x


PLAYBOOK=$1
DB_PASSWORD=$2
GIT_URL=$3
ROLE=$4

# ansible-playbook $PLAYBOOK -i $INVENTORY

ansible-playbook $PLAYBOOK -e "DB_PASSWORD=$DB_PASSWORD" -e "GIT_URL=$GIT_URL" -e "ROLE=$ROLE"

status=$?
[ $status -eq 0 ] && echo "SUCCESS" || echo "FAILURE"