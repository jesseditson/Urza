var winston = require('winston'),
  SNS = require('winston-sns'),
	_ = require('underscore'),
	config = require('config'),
  env=config.environment;

// set up default options for our environments
var options = {
  transports : [],
	levels : {
    'report' : 1,
	  'event' : 2
  }
};

var reporter = new(winston.Logger)(options);

// **Amazon SNS notifications**
// If provided, this will use amazon sns to notify you if the proxy hits an uncaught exception.

var amazon = config.amazon;

// require some config stuff
if(env!='production' || !amazon || ['key','secret','id','topic'].some(function(i){ return !amazon[i] || !amazon[i].length; })){
  // use a console transport in development to let developer know that it's reporting correctly
  reporter.add(winston.transports.Console,{ "colorize" : true, "level" : "report", "silent" : false, "handleExceptions" : false });
} else {
  // set up notification options
  var snsConfig = {
    "aws_key" : amazon.key,
    "aws_secret" : amazon.secret,
    "subscriber" : amazon.id,
    "topic_arn" : amazon.reporterTopic,
    "level":"report",
    "subject" : "%l:%e",
    "message" : '%m',
    "json" : true
  };
  reporter.add(winston.transports.SNS,snsConfig);
}

module.exports = reporter;
