// Dependencies
// ------------

var useragent = require('useragent'),
    config = require('config');

// UserAgent Middleware
// --------------------

var UserAgent = module.exports = function(req,res,next){
  if(config.mobileOnly){
    req.isMobile = true;
  } else {
    var ua = useragent.is(req.headers['user-agent']);
    req.isMobile = (ua.mobile_safari || false);
  }
  next();
}