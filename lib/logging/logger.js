// Dependencies
// ------------
var path = require('path'),
  fs = require('fs'),
  winston = require('winston'),
  SNS = require('winston-sns'),
  config = require('config-heroku'),
  mkdirpSync = require('mkdirp').sync

// Local Variables
var amazon = config.amazon,
    log_folder = config.log_folder || "tmp"
    loggly = config.loggly;

// Helpers
if(config.logFiles){
  // make sure our log folder exists
  if(!path.existsSync(log_folder)){
    mkdirpSync(log_folder,755);
  }
}

// Set up our options
var options = {
    "transports" : [
      // Defaults to logging to a console.
      new (winston.transports.Console)({ "colorize" : true, "level" : "silly", "silent" : false, "timestamp" : true, "json":false,"prettyPrint" : true})
    ],
    exceptionHandlers : [new (winston.transports.Console)({ "colorize" : true, "level" : "info", "silent" : false, "timestamp" : true, "json":false,"prettyPrint" : true})],
    exitOnError : true
  };
if(config.environment == "production"){
  options.exitOnError = false;
}

// Create the winston instance
var logger = new (winston.Logger)(options);

// Add-Ons
// -------

// **Log Files**
// If config.logFiles is true, we'll log to files.
if(config.logFiles && path.existsSync(log_folder)){
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
if(!loggly || !loggly.subdomain || !(loggly.inputToken || ['auth','inputName'].some(function(i){ return loggly[i] && loggly[i].length; }))){
  logger.warn("Loggly logging is turned off. To use this feature, provide a loggly subdomain, and either auth and inputName or inputToken.");
} else {
  var Loggly = require('winston-loggly').Loggly
  var logglyOptions = { "level" : "silly", "subdomain" : loggly.subdomain, "json" : true}
  if(loggly.inputToken){
    logglyOptions.inputToken = loggly.inputToken
  } else {
    logglyOptions.auth = loggly.auth
    logglyOptions.inputName = loggly.inputName
  }
  logger.add(Loggly,logglyOptions);
  logglyOptions.handleExceptions = true
  logger.handleExceptions(Loggly,logglyOptions)
}

// If logger itself throws an error, don't re-throw.
logger.on('error',function(err){
    /// in production, don't throw this error.
    console.error("Logger threw an error: " + err.message);
});

// export the module.
module.exports = logger;
