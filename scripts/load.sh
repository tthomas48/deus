#!/bin/bash
phone=$1
phoneprefix=`uuid`
num_options=$2
attackers=$3
#i=0
#while [ $i -lt $num_options ]
#do
#  i=$(($i+1))
node scripts/load.js $phone $phoneprefix $num_options $attackers &
#done
