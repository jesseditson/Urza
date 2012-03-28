#!/bin/bash
if [ -z $1 ]
  then
  echo "no key specified."
  exit 1
fi
if [ -z "${2}" ]
  then
  jsonFile="../config/runtime.json"
else
  jsonFile=$2
fi
ENVLINE=`cat $jsonFile | grep $1`
pattern='\"([^"]+)\"[,\s]*$'
if [[ $ENVLINE =~ $pattern ]]
  then
  echo ${BASH_REMATCH[1]}
  exit
elif [ -n $2 ] 
  then
  if [[ `cat ../config/default.json | grep $1` =~ $pattern ]]
    then
    echo ${BASH_REMATCH[1]}
    exit
  else
    exit 1
  fi
fi