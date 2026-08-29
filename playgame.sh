#!/bin/sh
set -e

for i in $(seq $1 -1 1)
do
    test $2 && logfile=$2 || logfile=./log/`date '+%Y%m%d-%H%M%S'`.json
    node bin/mjai-diannao.js mjsonp://localhost:11600/default -v -o $logfile
    echo; echo "[$((i - 1))]" `date` >&2 ; echo
    sleep 1
done
