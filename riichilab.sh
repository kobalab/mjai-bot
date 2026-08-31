#!/bin/sh
set -e

[ $# -gt 0 ] || { echo "Usage: $0 count params..."; exit 1; }

n=$1; shift

if [ $n = '-' ]
then
    while :
    do
        node dev/riichilab.js "$@"
        date
        sleep 60
    done
else
    while [ $n -gt 0 ]
    do
        node dev/riichilab.js "$@"
        n=$((n - 1))
        echo "[$n] $(date)"
        [ $n -gt 0 ] && sleep 60
    done
fi
