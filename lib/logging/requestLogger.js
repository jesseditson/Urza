/* requestLogger
* Shamelessly ripped off from https://github.com/mathrawka/express-request-logger
* put in a file so we can mess with it without the hassle of forking, etc.
*
*/
exports.create = function(logger) {

  return function(req, res, next) {
    var rEnd = res.end;

    // To track response time
    req._rlStartTime = new Date();

    // Setup the key-value object of data to log and include some basic info
    req.kvLog = {
        date: req._rlStartTime.toISOString()
      , method: req.method
      , url: req.originalUrl
      , _rlLevel: 'info' // internal usage
      , type: 'reqlog'
    };

    // Proxy the real end function
    res.end = function(chunk, encoding) {
      // Do the work expected
      res.end = rEnd;
      res.end(chunk, encoding);

      // And do the work we want now (logging!)

      // Save a few more variables that we can only get at the end
      req.kvLog.status = res.statusCode;
      req.kvLog.response_time = (new Date() - req._rlStartTime);

      // Send the log off to winston
      var level = req.kvLog._rlLevel;
      delete req.kvLog._rlLevel;
      logger.log(level, '', req.kvLog);
    };

    next();
  };
};