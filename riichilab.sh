#!/bin/sh
set -e

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
        sleep 60
    done
else
    while [ $n -gt 0 ] && [ $stop -eq 0 ]
    do
        node dev/riichilab.js "$@"
        [ $stop -eq 1 ] && exit
        n=$((n - 1))
        [ $n -gt 0 ] && sleep 60
    done
fi
