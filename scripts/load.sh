#!/bin/bash
phone=$1
phoneprefix=$2
num_options=$3
attackers=$4
#i=0
#while [ $i -lt $num_options ]
#do
#  i=$(($i+1))
node load.js $phone $phoneprefix $num_options $attackers &
#done
