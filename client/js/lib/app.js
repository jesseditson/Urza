var viewObject = {};
define(
  ['lib/router'].concat(Object.keys(viewObject)),
  function(Router){
    var viewsArray = Array.prototype.slice.call(arguments,1),
        app = new Router(),
        routes = {},
        views = {},
        viewNum = 0;
    // stick views in an object
    for(var viewPath in viewObject){
      var viewName,
          viewNameMatches = viewPath.match(/(\/[^\/]+)(\.js)?$/);
      if(!viewNameMatches[1]){
        throw new Error('view name for view '+viewPath+' is malformed. Failed to load views.');
        return;
      }
      viewName = viewNameMatches[1];
      views[viewName] = viewsArray[viewNum];
      viewNum ++;
    }
    // loop through views and set up the basics.
    for(var name in views){
      var view = views[name];
      view.router = app;
      app.route(name + '/' + viewPath,name,view,_.bind(function(){
        if(this.route){
          this.route.apply(this,arguments);
        } else {
          this.show();
        }
      },view));
    }
    return {
      views : views,
      router : app
    };
  });