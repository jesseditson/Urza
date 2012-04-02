#!/usr/bin/env node
// Urza
// ----
// Urza is a framework for rapid node.js development.
// If you'd like to know more about urza, check out the README.md file in this same folder.
// ©2011 Jesse Ditson

if(require.main === module) {
  // Urza was called as a command line script.
  
  // Dependencies
  // ------------
  var fs = require('fs'),
      wrench = require('wrench'),
      mkdirp = require('mkdirp'),
      async = require('async'),
      exec = require('child_process').exec,
      program = require('commander');

  // **Main Urza file. This does all sorts of handy tasks.**

  // Some setup stuff to get ready.
  var version = JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;

  // Command-Line App
  // ----------------

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
      var options = JSON.parse(fs.readFileSync(__dirname + '/example/package.json'));
      console.log('creating app %s...',appdir);
      // set up our app basics:
      var prompts = [
          ['prompt','What is your name?: ',function(author){ options.author = author; }],
          ['prompt','What is your email address?: ',function(email){ options.author += "<"+email+">"; }],
          ['prompt','Give your creation a name (no spaces allowed.): ',function(name){ options.name = name; }],
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
        // TODO: be more graceful with these errors.
        if(!options.name){
          console.error('Missing one or more required fields. Please fill in all the info asked.');
          process.exit(1);
        } else {
          // after all commands have finished, do this stuff:
          mkdirp(appdir,function(err){
            if(err){
              throw err;
              process.exit(1)
            } else {
              wrench.copyDirSyncRecursive(__dirname + '/example',appdir);
              console.log('created directory tree.');
              // we have created the app folder. now create the package.json file and replace appName in the files.
              // TODO: walk the file tree and replace [[APPNAME]] with the app name.
              // rename the database to match this app.
              if(!options.db) options.db = {};
              options.db.name = appdir + "_db";
              // TODO: autodetect git repo.
              fs.writeFile(appdir + '/package.json',JSON.stringify(options,null,4));
              console.log('installing dependencies...');
              exec('cd '+appdir+' && npm install',function(){
                process.exit(0);
              });
            }
          });
        }
      });
    });

  // Start it up
  program.parse(process.argv);
} else {
  // Urza was require()'d.
  
  // Dependencies
  // ------------

  var express = require('express'),
      cluster = require('cluster'),
      fs = require('fs'),
      path = require('path'),
      gzippo = require('gzippo');

  // Module Dependencies
  // -------------------
  var logger = require('./lib/logging/logger.js'),
    reqLogger = require('./lib/logging/requestLogger.js'),
    expressHandlebars = require('./lib/helpers/express-handlebars.js'),
    useragent = require('./lib/helpers/middleware/useragent.js'),
    render = require('./lib/helpers/middleware/render.js'),
    api = require('./lib/api.js');

  // Urza App Class
  // --------------
  var UrzaServer = module.exports.Server = function(options){
    this.options = options;
    this.app = this.createApp();
    this.addRoutes(this.app);
    // mimic the routing behavior of express.
    var expressMethods = ['get','post','all'];
    expressMethods.forEach(function(method){
      this[method] = this.app[method];
    }.bind(this));
  }

  // **Start Server**
  // starts up the app
  UrzaServer.prototype.start = function(){
    if (this.options.environment=="production") {
      var numCpus = require('os').cpus().length;
    	// in production, set up cluster
    	if (cluster.isMaster) {
    		if (this.options.numberOfWorkers){
    			var numberOfWorkers = config.numberOfWorkers;
    		} else {
    			if (numCpus>1) {
    				var numberOfWorkers = numCpus; 
    			} else {
    				var numberOfWorkers = 2;
    			};
    		}
    		for(var i=0; i< numberOfWorkers; i++) {
    			cluster.fork();
    		}
    	 	cluster.on('death', function(worker) {
    			cluster.fork();
    	  	});
    	} else {
    		this.app.listen(this.options.serverPort);
    		logger.debug("Urza server master started listening on port: " + this.options.serverPort)
    	};	
    } else {
    	// in development, just run as an express instance.
    	this.app.listen(this.options.serverPort);
    	logger.debug("Urza server started as single process listening on port: " + this.options.serverPort)	
    };
  }

  // **Create App**
  // creates and configures an express app.
  UrzaServer.prototype.createApp = function(){
    var app = express.createServer();
    // **Express app configuration**
    app.configure(function(){
      // basic express stuff
    	app.use(express.bodyParser());
    	app.use(express.cookieParser());
      // TODO: add persistent sessions.
      // templates
      this.configureTemplates(app);
      // middleware
    	app.use(express.methodOverride());
    	if(this.options.environment == 'production'){
        app.use(gzippo.staticGzip('./client'));
      } else {
        app.use(express.static('./client'));
      }
      // if authenticate is specified, use the path specified as the authenticate middleware.
      if(this.options.authenticate){
        app.use(require(authenticate));
      }
    	app.use(useragent);
    	app.use(render);
    	app.use(reqLogger.create(logger));
    }.bind(this));
    // set up development only configurations
    app.configure('development', function(){
    	// Be as loud as possible during development errors
     	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    });
    // set up production only configurations
    app.configure('production', function(){
    	// Be as quiet as possible during production errors
     	app.use(express.errorHandler()); 
    });
    // add dynamic helpers
    this.configureHelpers(app);
    // return the ready to .listen() app.
    return app;
  }

  // **Set up dynamic helpers**
  // makes some assumptions about helpers...
  UrzaServer.prototype.configureHelpers = function(app){
    // set up dynamic helpers - these will be available in the layout scope when pages are rendered.
    var cssCache,
        componentPath = __dirname + '/client/css/components';
    app.dynamicHelpers({
      user : function(req,res){
        return req.session && req.session.user;
      },
      componentcss : function(req,res){
        if(!cssCache) cssCache = (path.existsSync(componentPath)) ? fs.readdirSync(componentPath) : [];
        return cssCache;
      }
    });
  }

  // **Set up Templating Engine**
  // configures the templating engine we want to work with.
  // TODO: may need larger abstraction of view logic.
  UrzaServer.prototype.configureTemplates = function(app){
    switch(this.options.templates.engine){
      case 'handlebars' :
        // set up view engine
        app.set('view engine','html');
      	app.set('views',__dirname+ '/client/views');
      	app.register('html',expressHandlebars);
        break;
      default :
        throw new Error('Unknown templating engine specified: "'+this.options.templates.engine+'"');
        break;
    }
  }

  // **Set up Routes**
  // sets up Urza's default routes
  UrzaServer.prototype.addRoutes = function(app){
    // **API Route**
    var callApi = function(params,session,body,callback){
      var params = params[0] ? params[0].split('/') : [];
      api.route(params,session,body,callback);
    }
    app.all("/api/*",function(req,res,next){
      callApi(req.params,req.session,req.body,function(err,response){
        if(err){
          res.json(err.message,500);
        } else {
          res.json(response);
        }
      });
    });
    //**Partial Route**
    // renders a partial based on an api call
    app.all('/partial/:name/*',function(req,res,next){
      callApi(req.params,req.session,req.body,function(err,response){
       if(err){
         res.json(err.message,500);
       } else {
         data = {
           data : response,
           layout : false
         };
         res.render('partials/' + req.params.name,data);
       }
      });
    });
    // **View Route**
    // Renders a view
    app.all('/view/:name',function(req,res,next){
      data = {
        data: req.body,
        layout : false
      };
      res.render(req.params.name,data);
    });
    // **Main App Route**
    app.all("/*",function(req,res,next){
      var params = req.prams && req.params.split('/');
      res.render('main');
    });
    // **404 Error Route**
    // this route always should go last, it will catch errors.
    app.all(/(.*)/,function(req,res){
      // TODO: make this prettier.
      res.send(404);
    });
  }
}