#!/bin/sh
set -e

cd `dirname $0`

[ $# -gt 0 ] || { echo "Usage: $0 count params..."; exit 1; }

trap '' HUP
stop=0
trap 'stop=1' TERM

n=$1; shift

if [ $n = '-' ]
then
    while [ $stop -eq 0 ]
    do
        node dev/riichilab.js "$@"
        [ $stop -eq 1 ] && exit
        sleep 15
    done
else
    while [ $n -gt 0 ] && [ $stop -eq 0 ]
    do
        node dev/riichilab.js "$@"
        n=$((n - 1))
    done
fi
