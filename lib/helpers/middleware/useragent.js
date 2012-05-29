// Dependencies
// ------------

var useragent = require('useragent'),
    config = require('config');

// UserAgent Middleware
// --------------------

var UserAgent = module.exports = function(req,res,next){
  if(config.mobileOnly){
    req.isMobile = true;
  } else if(config.webOnly){
    req.isMobile = false;
  } else {
    var ua = useragent.parse(req.headers['user-agent']).toString(),
        mobilePattern = /(ios|android|mobile|wii|webos|tablet|kindle|portable|palm|symbian|blackberry)/i
    if(ua.match(mobilePattern)){
      if(ua.match(/ipad/i)){
        req.isMobile = 'iPad';
      } else {
        req.isMobile = true;
      }
    } else {
      req.isMobile = false;
    }
  }
  next();
}
