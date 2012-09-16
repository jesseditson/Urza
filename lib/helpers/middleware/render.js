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
  var renderMiddlewares = res.app.server.renderMiddlewares || []
  var doRender = function(args,index){
    index = index || 0
    var next = renderMiddlewares[index]
    if(!renderMiddlewares.length || !next) return res.send.apply(res,args)
    next(args,function(newargs){
      doRender(newargs || args,index+1)
    })
  }
  res.render = function(){
    var args = Array.prototype.slice.call(arguments)
    // TODO: load this instead of hardcoding it.
    var layout = 'layout.html';
    if(req.headers.layout) layout = layout.replace(/(\.\w+$)/,'_'+(req.headers.layout)+'$1');
    args[0] = dir + "/" + args[0];
    args[1] = _.extend({layout : layout},args[1] || {});
    //if(!arguments[0].match(dir + '/layout')) arguments[1].layout = dir + "/layout";
    args.push(function(err,view){
      // allow jsonp
      if(req.body && req.body.jsonp_callback){
        view = req.body.jsonp_callback + "('" +view.replace("'","\'")+ "')"
        doRender([view])
      } else if(err){
        doRender([500,err])
      } else {
        doRender([view])
      }
    })
    resRender.apply(res,args);
  }
  next();
}
