// Dependencies
// ------------

var useragent = require('useragent');

// UserAgent Middleware
// --------------------

var UserAgent = module.exports = function(req,res,next){
  var ua = useragent.is(req.headers['user-agent']);
  req.isMobile = true; //(ua.mobile_safari || false);
  next();
}