define(
  ['lib/router','lib/views'],
  function(Router,viewInfo){
    var viewsArray = Array.prototype.slice.call(viewInfo.views),
        viewObject = viewInfo.routes,
        app = new Router(),
        viewRoutes = {},
        views = {},
        viewNum = 0;
    // stick views in an object
    for(var viewPath in viewObject){
      var viewName,
          viewNameMatches = viewPath.match(/\/([^\/]+)(\.js)?$/);
      if(!viewNameMatches || !viewNameMatches[1]){
        throw new Error('view name for view '+viewPath+' is malformed. Failed to load views.');
        return;
      }
      viewName = viewNameMatches[1];
      views[viewName] = viewsArray[viewNum];
      viewRoutes[viewName] = viewObject[viewPath];
      viewNum ++;
    }
    // loop through views and set up the basics.
    for(var name in views){
      var view = views[name];
      view.router = app;
      app.route(viewRoutes[name],name,_.bind(function(){
        if(this.route){
          this.route.apply(this,arguments);
        } else {
          this.show();
        }
      },view));
    }
    return {
      views : views,
      router : app,
      start : app.start
    };
  });