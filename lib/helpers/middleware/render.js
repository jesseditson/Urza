// Render
// ------
// hijacks the built-in render, replaces with a mobile-specific one.
// requires useragent to work.

var Render = module.exports = function(req,res,next){
  var resRender = res.render,
    dir = req.isMobile ? 'mobile' : 'web';
  res.rawRender = resRender;
  res.render = function(){
    arguments[0] = dir + "/" + arguments[0];
    arguments[1] = arguments[1] || {};
    //if(!arguments[0].match(dir + '/layout')) arguments[1].layout = dir + "/layout";
    resRender.apply(res,arguments);
  }
  next();
}