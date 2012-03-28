#!/bin/bash
logFolder=`./getJsonVal.sh log_folder`
app=`./getJsonVal.sh main ../package.json`
if [[ -z $logFolder ]]
  then
  exit 1
elif [[ -z $app ]]
  then
  exit 1
else
  echo "shutting down."
  cd ..
  proc=`cat $logFolder/$app.pid`
  if [ -n $proc ]
    then
    kill $proc
  fi
  exit 0
fi