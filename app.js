// Dependencies
// ------------
var cluster = require('cluster'),
  fs = require('fs'),
  express = require('express'),
  _ = require('underscore'),
  exec = require('child_process').exec,
  config = require('config'),
  gzippo = require('gzippo'),
	everyauth = require('everyauth'),
	MongoStore = require('connect-mongo');

// Module Dependencies
// -------------------
var logger = require('./lib/logging/logger.js'),
  reqLogger = require('./lib/logging/requestLogger.js'),
  expressHandlebars = require('./lib/helpers/express-handlebars.js'),
  authenticate = require('./lib/helpers/middleware/authenticate.js'),
  useragent = require('./lib/helpers/middleware/useragent.js'),
  render = require('./lib/helpers/middleware/render.js'),
  api = require('./lib/api/api.js'),
  numCpus = require('os').cpus().length;

// Local Variables
// ---------------
var numCpus = require('os').cpus().length,
  app = express.createServer(),
  publicDir = "client"; ///config.environment == "development" ? "client" : "public";

// Configuration
// -------------
// this section is for configuration of the server
// and any modules requiring global configuration

// Scope definition for everyAuth
var fbScope = 
  'user_about_me,' +
  'user_birthday,' +
  'user_checkins,' +
  'user_location,' +
  'user_hometown,' +
  'user_relationships,' +
  'user_relationship_details,' +
  'email,' +
  'user_work_history,'+
  'user_education_history,'+
  'publish_actions,' +
  'friends_about_me,' + 
  'friends_birthday,' +
  'friends_location,' +
  'friends_hometown,'+
  'friends_relationships,' +
  'friends_relationship_details,'+
  'friends_interests,' +
  'friends_work_history,' +
  'friends_education_history';
  
// **EveryAuth for Facebook**
everyauth.facebook
  .mobile(true)
	.appId(config.facebookAppId)
	.appSecret(config.facebookAppSecret)
    .moduleErrback( function (err, data) {
      // ToDo: clean up error handlings
      logger.error("Error in user trying to login with facebook");
      logger.error(err.toString());
      if (err.toString().indexOf("timed out") == -1) {
        var res = data.res;
        res.redirect('/somethingWrong');
      } else {
        // ignoring time out errors
      }
    })
	.handleAuthCallbackError( function (req, res, next) {
    logger.error("facebook app denied access.");
	  // TODO: handle this, display error message.
	})
	.findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {
		return this.Promise().fulfill(fbUserMetadata);
	})
	.redirectPath('/')
	.myHostname(config.hostname)
	.moduleTimeout( 30000 )
    .scope(fbScope);

// **Express app configuration**
app.configure(function(){
  // basic express stuff
	app.use(express.bodyParser());
	app.use(express.cookieParser());
  // set up mongo to store our sessions
	app.use(express.session({
		secret: config.sessionSecret,store: new MongoStore({
			db : config.dbName,
			host : config.dbHost,
			port : config.dbPort,
			clear_interval : 3600
		})
	}));
  // set up view engine
  app.set('view engine','html');
	app.set('views',__dirname+ '/' +publicDir+ '/views');
	app.register('html',expressHandlebars);
  // middleware
	app.use(express.methodOverride());
	app.use(everyauth.middleware());
  everyauth.helpExpress(app);
	if(config.environment == 'production'){
    app.use(gzippo.staticGzip(__dirname + '/' + publicDir));
  } else {
    app.use(express.static(__dirname + '/' + publicDir));
  }
	app.use(authenticate);
	app.use(useragent);
	app.use(render);
	app.use(reqLogger.create(logger));
});
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

// Helpers
// -------

// TODO: move view helpers to a place that makes more sense.

// To decorate the gift description differently for Cash and non-cash-only gifts
expressHandlebars.registerHelper('decorateDescription', function(gift, totalValue) {
  if (gift.giftType == "cash") {
    var value = ( !totalValue ) ? gift.freeValue : totalValue;
    return "$" + value + " at " + gift.client;  // ex: $25 at NordStroms
  } else if (gift.giftType == "productAndCash" && typeof totalValue != 'undefined' && totalValue > 0) {
    return "$" + totalValue + " at " + gift.client + " AND " + gift.giftDescription;  // ex: $25 at Godiva AND One free chocolate
  } else {
    return gift.giftDescription;  // ex: One free chocolate at Godiva
  }
});
expressHandlebars.registerHelper('pluralize',function(number, single, plural) {
  return (number == 1) ? single : plural;
});

// pretty date - does what it says.
var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    months = ['January','February','March','April','May','June','July','August','September','October','November','December'],
    ordinal = function(n) {
      var sfx = ["th","st","nd","rd"];
      var val = n%100;
      return n + (sfx[(val-20)%10] || sfx[val] || sfx[0]);
    };
expressHandlebars.registerHelper('prettyDate',function(date){
  var d = date ? new Date(date) : new Date();
  return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + ordinal(d.getDate());
});
// current date - just returns the current date as a string.
expressHandlebars.registerHelper('currentDate',function(){
  return new Date();
});
// input type="date" compatible date string
expressHandlebars.registerHelper('ISODate',function(date){
  var d = date ? new Date(date) : new Date();
  // TODO: validate date
  return d.toISOString();
});

// set up dynamic helpers - these will be available in the layout scope when pages are rendered.
var cssCache;
app.dynamicHelpers({
  user : function(req,res){
    return req.session.user;
  },
  componentcss : function(req,res){
    if(!cssCache) cssCache = fs.readdirSync(__dirname + '/' + publicDir + '/css/components');
    return cssCache;
  }
});

// Routing Methods
// ---------------

var render = function(res,page,obj){
  var obj = obj || {};
}

// Routes
// ------

// **Logout**
app.all('/leave',function(req,res,next) {
	req.session.destroy();
  res.redirect('/');
});

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

// **Access Code Routes**
app.get('/access_code',function(req,res,next){
  res.render('access_code');
});

app.get('/somethingWrong',function(req,res,next){ 
  res.render('somethingWrong');
});

// **Main App Route**
app.all("/*",function(req,res,next){
  var user = req.session.user,
    params = req.prams && req.params.split('/');
  if(req.authenticated != true || !user){
    res.render('public',{layout:false});
  } else {
    res.render('main',{user : user});
  }
});

// **404 Error Route**
// this route always should go last, it will catch errors.
app.all(/(.*)/,function(req,res){
  // TODO: make this prettier.
  res.send(404);
});

// Start The App
// -------------

// re-package the client scripts
//logger.debug('packaging source...');
//exec('node node_modules/requirejs/bin/r.js -o client/js/external/app.build.js',function(err,stdout,stderr){
  // TODO: handle errors. For now, just assume it worked.
  //logger.debug('starting app!');
  //app.listen(config.serverPort);
  //});
  
  // Start the App
  // -------------
  if (config.environment=="production") {
  	// in production, set up cluster
  	if (cluster.isMaster) {
  		if (config.numberOfWorkers){
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
  		app.listen(config.serverPort);
  		logger.debug("Express server master started listening on port: " + config.serverPort)
  	};	
  } else {
  	// in development, just run as an express instance.
  	app.listen(config.serverPort);
  	logger.debug("Express server started as single process listening on port: " + config.serverPort)	
  };
  
