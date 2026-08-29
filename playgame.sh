#!/bin/sh
set -e

test $2 && logfile=$2 || logfile=./log/`date '+%Y%m%d-%H%M%S'`.json

for i in $(seq $1 -1 1)
do
    node bin/mjai-diannao.js mjsonp://localhost:11600/default -v -o $logfile
    echo; echo "[$((i - 1))]" `date` >&2 ; echo
    sleep 1
done
