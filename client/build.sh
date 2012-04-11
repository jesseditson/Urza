#!/bin/bash
# executes the require js build script.
# must be called from server.js in an Urza app.

# remove the current public folder
rm -rf ./public
# build it! 
node node_modules/urza/node_modules/requirejs/bin/r.js -o node_modules/urza/client/js/external/app.build.js
