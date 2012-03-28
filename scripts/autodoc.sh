#!/bin/bash
# generate docs if we're not in production.
# check if we have a runtime json

#disabled for now. name conflicts cause problems.
echo "not generating docs."
exit 0

if [[ -f "config/runtime.json" ]]
	then
	# if we are, make sure that it doesn't define production as our env
	ENVLINE=`cat config/runtime.json | grep environment`
else
  ENVLNE=''
fi
pattern='\"([^"]+)\"[,\s]{0,}$'
if [ -z $ENVLINE ] || [ $ENVLINE =~ $pattern ]
	then
	# check if dependencies exist
	pygmentizeVersion=`pygmentize -V`
	if [[ -z $pygmentizeVersion ]]
		then
		echo "If you want to generate documentation, install pygments"
		echo "You can easily install it in snow leopard using:"
		echo "sudo easy_install pygments"
		exit 0
	fi
	ENV=${BASH_REMATCH[1]}
	if [[ $ENV != "production" ]] || [ -z $ENVLINE ]
		then
		echo "Generating documentation..."
    rm -Rf "docs"
		find . | grep "\.js$" | grep -v grep | grep -v "node_modules" | xargs docco
	fi
else 
  echo "production mode detected. Not regenerating docs."
fi