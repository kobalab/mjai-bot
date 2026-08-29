#!/bin/sh
set -e

for i in $(seq $1 -1 1)
do
    node dev/riichilab.js -v
    echo; echo "[$((i - 1))]" `date` >&2 ; echo
    sleep 1
done
