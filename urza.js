#!/usr/bin/env node
// Urza
// ----
// Urza is a framework for rapid node.js development.
// It aims to stand on the shoulders of whichever giants you prefer.
// If you'd like to know more about urza, check out the README.md file in this same folder.
// ©2011 Jesse Ditson

// Dependencies
// ------------
var fs = require('fs'),
    wrench = require('wrench'),
    mkdirp = require('mkdirp'),
    async = require('async'),
    program = require('commander');

// **Main Urza file. This does all sorts of handy tasks.**

// Some setup stuff to get ready.
var version = JSON.parse(fs.readFileSync('./package.json')).version;

// Set up our program:
program
  .version(version);

// Urza's Tasks
// ------------

// **Create**
// creates an Urza app.

program
  .command('create [appname]')
  .description('create a new Urza app')
  .action(function(appdir){
    appdir = appdir || "mySuperGreatApp";
    var options = JSON.parse(fs.readFileSync('./example/package.json'));
    console.log('creating app %s...',appdir);
    // set up our app basics:
    var prompts = [
        ['prompt','What is your name?: ',function(author){ options.author = author; }],
        ['prompt','What is your email address?: ',function(email){ options.author += "<"+email+">"; }],
        ['prompt','Give your creation a name: ',function(name){ options.name = name; }],
        ['prompt','Describe your creation: ',function(desc){ options.desc = desc; }]
      ],
      // loops through commands until they are finished.
      doCommands = function(callback,i){
        i=i||0;
        var p = prompts[i],
            command=program[p.shift()],
            done=p.pop();
        p.push(function(){
          done.apply(program,arguments);
          i = i+1;
          if(i<prompts.length){
            doCommands(callback,i);
          } else {
            callback();
          }
        });
        command.apply(program,p);
      }
    doCommands(function(){
      // after all commands have finished, do this stuff:
      mkdirp(appdir,function(err){
        if(err){
          throw err;
          process.exit(1)
        } else {
          wrench.copyDirSyncRecursive('./example',appdir);
          console.log('created directory tree.');
          // we have created the app folder. now create the package.json file.
          // TODO: autodetect git repo.
          fs.writeFile(appdir + '/package.json',JSON.stringify(options,null,4));
        }
      });
    });
  });

// Start it up
program.parse(process.argv);