// **Create Commands**
// these create Urza app items.

// Helpers
var appViewFolder = '/client/js/lib/views/',
    appHtmlFolders = ['/client/views/mobile/','/client/views/web/'],
    appViewFile = '/client/js/lib/views.js',
    requireViewPath = 'lib/views/',
    updateViews = function(viewRoutes,raw){
      var root = getAppRoot(),
          appFile = root + appViewFile,
          viewFolder = root + appViewFolder,
          htmlFolders = appHtmlFolders.map(function(folder){ return root + folder; });
      if(path.existsSync(appFile)){
        var clientContents = fs.readFileSync(appFile,'utf8'),
            viewFiles = fs.readdirSync(viewFolder),
            viewObjectPattern = /viewObject\s*=\s*(\{[^\{\}]*\})/,
            viewObjectMatches = clientContents.match(viewObjectPattern),
            viewArrayPattern = /define\((\[[^\]]*\])?/,
            viewArrayMatches = clientContents.match(viewArrayPattern);
        if(!viewObjectMatches || !viewObjectMatches[1] || !parseJSON(viewObjectMatches[1])){
          console.error('Error updating views. app.js does not appear to define a valid viewObject.');
          process.exit(1);
        }
        var viewObject = parseJSON(viewObjectMatches[1]),
            viewArray = parseJSON((viewArrayMatches && viewArrayMatches[1]) || '[]'),
            viewHtmlTemplate = fs.readFileSync(__dirname + '/templates/view.html','utf8'),
            viewTemplate = fs.readFileSync(__dirname + '/templates/view.js','utf8');
        // loop through the views in viewRoutes
        for(var viewName in viewRoutes){
          if(!~viewFiles.indexOf(viewName + '.js')){
            // we don't have this view yet, add it.
            viewObject[requireViewPath + viewName] = '';
            viewArray.push(requireViewPath + viewName);
            if(viewRoutes[viewName]){
              // we have a route for this view.
              viewObject[requireViewPath+viewName] = viewRoutes[viewName].replace(/^\//,'');
            }
            // create the view.
            console.log('adding %s file',viewName+'.js');
            fs.writeFileSync(viewFolder + viewName + '.js', viewTemplate.replace(/\[\[NAME\]\]/g,viewName),'utf8');
            if(!raw){
              try {
                // create the corresponding html files.
                htmlFolders.forEach(function(folder){
                  // TODO: should the extension be read from the app settings?
                  console.log('adding %s file to %s',viewName+'.html',folder);
                  fs.writeFileSync(folder + viewName + '.html',viewHtmlTemplate.replace(/\[\[NAME\]\]/g,viewName),'utf8');
                });
              } catch(e) {
                console.error('Error creating view files. '+e.message);
                // TODO: cleanup after error
                process.exit(1);
              }
            }
          } else {
            // this view already exists.
            console.error('This view already exists - if you really want to replace it, please remove it first.');
            process.exit(1);
          }
        }
        var newClient = clientContents
                          .replace(viewObjectPattern,'viewObject = ' + JSON.stringify(viewObject,2))
                          .replace(viewArrayPattern,'define(' + JSON.stringify(viewArray,2));
        console.log('updating view object in views.js');
        fs.writeFileSync(appFile,newClient,'utf8');
      } else {
        console.error('Error updating views. Did you delete the views.js file?');
        process.exit(1);
      }
    },
    createView = function(name,route,raw){
      var root = getAppRoot(),
          routes = {};
      routes[name] = route;
      updateViews(routes,raw);
    },
    removeView = function(name){
      var root = getAppRoot(),
          appFile = root + appViewFile,
          viewFolder = root + appViewFolder,
          htmlFiles = appHtmlFolders.map(function(folder){ return root + folder + name + '.html'; }),
          removeFiles = [viewFolder + name + '.js'].concat(htmlFiles);
      if(path.existsSync(appFile)){
        var clientContents = fs.readFileSync(appFile,'utf8'),
            viewFiles = fs.readdirSync(viewFolder),
            viewObjectPattern = /viewObject\s*=\s*(\{[^\{\}]*\})/,
            viewObjectMatches = clientContents.match(viewObjectPattern),
            viewArrayPattern = /define\((\[[^\]]*\])?/,
            viewArrayMatches = clientContents.match(viewArrayPattern);
        if(!viewObjectMatches || !viewObjectMatches[1] || !parseJSON(viewObjectMatches[1])){
          console.error('Error updating views. app.js does not appear to define a valid viewObject.');
          process.exit(1);
        }
        var viewObject = parseJSON(viewObjectMatches[1]),
            viewArray = parseJSON((viewArrayMatches && viewArrayMatches[1]) || '[]');
        delete viewObject[requireViewPath + name];
        viewArray.splice(viewArray.indexOf(requireViewPath + name),1);
        var newClient = clientContents
                          .replace(viewObjectPattern,'viewObject = ' + JSON.stringify(viewObject,2))
                          .replace(viewArrayPattern,'define(' + JSON.stringify(viewArray,2));
        console.log('updating view object in views.js');
        fs.writeFileSync(appFile,newClient,'utf8');
        console.log('removing view files');
        removeFiles.forEach(function(file){
          if(path.existsSync(file)){
            fs.unlinkSync(file);
          } else {
            console.warn('didn\'t find view file %s - assuming it was deleted and continuing.',file);
          }
        });
        process.exit(0);
      } else {
        console.error('Error updating views. Did you delete the views.js file?');
        process.exit(1);
      }
    },
    createPartial = function(name){
      var root = getAppRoot(),
          htmlFiles = appHtmlFolders.map(function(folder){ return root + folder + 'partials/' + name + '.html'; }),
          viewTemplate = fs.readFileSync(__dirname + '/templates/partial.html','utf8');
      console.log('creating partial');
      htmlFiles.forEach(function(file){
        // create the partial.
        console.log('adding partial %s ',file);
        fs.writeFileSync(file, viewTemplate.replace(/\[\[NAME\]\]/g,name),'utf8');
      });
    },
    removePartial = function(name){
      var root = getAppRoot(),
          htmlFiles = appHtmlFolders.map(function(folder){ return root + folder + 'partials/' + name + '.html'; });
      htmlFiles.forEach(function(file){
        console.log('removing partial %s',file);
        if(path.existsSync(file)){
          fs.unlinkSync(file);
        } else {
          console.warn('didn\'t find partial file %s - assuming it was deleted and continuing.',file);
        }
      });
      process.exit(0);
    };
module.exports = function(program){
  // Command
  program
    .command('create type [name]')
    .description('creates a new view or partial in the current Urza app.\n use `create view <name>` or `create partial <name>`.')
    .option('-r, --route <route>','specify a route for this to match. (view only)')
    .option('-j, --raw','don\'t create html views for this item. (view only)')
    .action(function(type,info){
      throw new Error("Sorry, create is not currently supported. Bug jesse to rewrite it.")
      var rawArgs = info.parent.rawArgs,
          name = rawArgs[rawArgs.length-1];
      if(type=='view'){
        // create view command
        var route = info.route,
            raw = info.raw;
        createView(name,route,raw);
      } else if(type=='partial'){
        // create partial command
        createPartial(name);
      } else {
        if(type){
          console.log("I don't know how to create %s.",type);
        } else {
          console.log('please specify what you would like to create.');
        }
      }
    });
}