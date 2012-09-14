// Dependencies
// ------------
var path = require('path'),
  fs = require('fs'),
  winston = require('winston'),
  SNS = require('winston-sns'),
  config = require('node-config-heroku');

// Local Variables
var amazon = config.amazon,
  log_folder = config.log_folder || "tmp",
  loggly = config.loggly;

// Helpers
var mkdirpSync = function(dir,pre){
  var parts = dir.split('/'),
      top = parts.shift();
  pre = pre || "."
  if(top && !path.existsSync(top)){
    fs.mkdirSync(pre + "/" + top);
  } else if(path){
    mkdirpSync(parts.join('/'),top);
  }
}

if(config.logFiles){
  // make sure our log folder exists
  if(!path.existsSync(log_folder)){
    mkdirpSync(log_folder);
    
  }
}

// Set up our options
var options = {
    "transports" : [
      // Defaults to logging to a console.
      new (winston.transports.Console)({ "colorize" : true, "level" : "silly", "silent" : false, "timestamp" : true, "json":false,"prettyPrint" : true})
    ]
  };
if(config.environment == "production"){
  options.exitOnError = false;
  options.exceptionHandlers = [new (winston.transports.Console)({ "colorize" : true, "level" : "info", "silent" : false, "timestamp" : true, "json":false,"prettyPrint" : true})];
}

// Create the winston instance
var logger = new (winston.Logger)(options);

// Add-Ons
// -------

// **Log Files**
// If config.logFiles is true, we'll log to files.
if(config.logFiles){
  logger.add(winston.transports.File,{ "filename" : log_folder + "/log.log", "timestamp" : true, "level" : "info", "json":false,"prettyPrint" : true });
  logger.handleExceptions(new (winston.transports.File)({ "filename": log_folder + "/exceptions.log", "timestamp" : true, "json":false,"prettyPrint" : true }));
}

// **Amazon SNS notifications**
// If provided, this will use amazon sns to notify you if the proxy hits an uncaught exception.

// require some config stuff
if(!amazon || ['key','secret','id','topic'].some(function(i){ return !amazon[i] || !amazon[i].length; })){
  logger.warn("Amazon SNS notification on error is turned off. You must provide a key, secret, id, and topic to use this feature.");
} else {
  // set up notification options
  var snsConfig = { "aws_key" : amazon.key, "aws_secret" : amazon.secret, "subscriber" : amazon.id, "topic_arn" : amazon.topic,"level":"error", "handleExceptions" : true};
  logger.add(winston.transports.SNS,snsConfig);
  logger.handleExceptions(new (winston.transports.SNS)(snsConfig));
}

// **Loggly Config**
// If provided, this will use loggly for logging.

// require some stuff
if(!loggly || ['subdomain','auth','inputName'].some(function(i){ return !loggly[i] || !loggly[i].length; })){
  logger.warn("Loggly logging is turned off. To use this feature, provide a loggly subdomain, auth and inputName.");
} else {
  logger.add(winston.transports.Loggly,{ "level" : "info", "subdomain" : loggly.subdomain, "auth" : loggly.auth, "inputName" : loggly.inputName, "json" : false});
}

// If logger itself throws an error, don't re-throw.
logger.on('error',function(err){
    /// in production, don't throw this error.
    console.error("Logger threw an error: " + err.message);
});

// export the module.
module.exports = logger;
