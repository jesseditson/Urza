// Render
// ------
// hijacks the built-in render, replaces with a mobile-specific one.
// requires useragent to work with user agents.

var _ = require('underscore');

var Render = module.exports = function(req,res,next){
  var resRender = res.render,
    dir = req.isMobile ? 'mobile' : 'web';
    if(req.isMobile == 'iPad'){
      dir = 'web'
    }
  res.rawRender = resRender;
  res.render = function(){
    var args = Array.prototype.slice.call(arguments)
    // TODO: load this instead of hardcoding it.
    var layout = 'layout.html';
    if(req.headers.layout) layout = layout.replace(/(\.\w+$)/,'_'+(req.headers.layout)+'$1');
    args[0] = dir + "/" + args[0];
    args[1] = _.extend({layout : layout},args[1] || {});
    //if(!arguments[0].match(dir + '/layout')) arguments[1].layout = dir + "/layout";
    resRender.apply(res,args);
  }
  next();
}
