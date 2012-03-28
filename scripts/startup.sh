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
  procpid=`cat ${logFolder}/${app}.pid`
  if [ -z `ps -p $procpid | grep node | awk '{ print $1}'` ]
    then
      echo "starting..."
      cd ..
      mkdir -p "${logFolder}"
      exec "node $app &"
      proc=$!;
      echo $proc > "${logFolder}/${app}.pid"
      echo "Started ${app} as ${proc}."
      disown
      exit 0
  else 
    echo "Server already running as $procpid. please shut down first."
    exit 1
  fi
fi