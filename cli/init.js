// **Init**
// creates an Urza app.

module.exports = function(program){
  program
    .command('init [appdir]')
    .description('create a new Urza app in current directory')
    .action(function(appdir){
      if(!appdir){
        console.error('Error: You must tell me where to put your app! Try init <appname>');
        process.exit(1);
      }
      var options = JSON.parse(fs.readFileSync(__dirname + '/example/package.json'));
      console.log('creating app %s...',appdir);
      // set up our app basics:
      var prompts = [
          ['prompt','What is your name?: ',function(author){ options.author = author; }],
          ['prompt','What is your email address?: ',function(email){ options.author += " <"+email+">"; }],
          ['prompt','Give your creation a name: ',function(name){ options.name = name.replace(' ','-'); }],
          ['prompt','Describe your creation: ',function(desc){ options.description = desc; }]
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
        // TODO: be more graceful with these errors.
        if(!options.name){
          console.error('Missing one or more required fields. Please fill in all the info asked.');
          process.exit(1);
        } else {
          // after all commands have finished, do this stuff:
          mkdirp(appdir,function(err){
            if(err){
              throw err;
            } else {
              wrench.copyDirSyncRecursive(__dirname + '/example',appdir);
              console.log('created directory tree.');
              // we have created the app folder. now create the package.json file and replace appName in the files.
              console.log('adding names to app files.');
              walk(appdir,function(file,folder){
                var fPath = folder + '/'+ file,
                    content = fs.readFileSync(fPath,'utf8').replace(/\[\[APPNAME\]\]/g,options.name);
                fs.writeFileSync(fPath,content);
              },function(){
                // rename the database to match this app.
                // TODO: make this edit the config/default.json file.
                //if(!options.db) options.db = {};
                //options.db.name = appdir + "_db";
                // TODO: autodetect git repo.
                fs.writeFile(appdir + '/package.json',JSON.stringify(options,null,4));
                console.log('installing dependencies...');
                exec('cd '+appdir+' && npm install',function(){
                  process.exit(0);
                });
              });
            }
          });
        }
      });
    });
}