define(
  ['lib/router','lib/views'],
  function(Router,viewInfo){
    var viewsArray = Array.prototype.slice.call(viewInfo.views),
        viewObject = viewInfo.routes,
        router = new Router(),
        viewRoutes = {},
        views = {},
        viewNum = 0;
    // stick views in an object
    for(var viewPath in viewObject){
      var viewName,
          route,
          raw = ['main'],
          viewNameMatches = viewPath.match(/\/([^\/]+)(\.js)?$/);
      if(!viewNameMatches || !viewNameMatches[1]){
        throw new Error('view name for view '+viewPath+' is malformed. Failed to load views.');
      }
      viewName = viewNameMatches[1];
      route = viewObject[viewPath];
      views[viewName] = viewsArray[viewNum];
      // if this route has optional params, convert to regex
      if(route.match(/:\w+\?/)){
        var optionPattern = /:(\w+)(\?)?\/?/g, match, regex="/",num=0;
        while(match = optionPattern.exec(route)){
          if(num){
            regex += match[2] ? "\\/?" : "\\/";
          } else {
            regex += match[2] ? "?" : "";
          }
          // NOTE: lint compains when ? and & are escaped, verify that it's not actually necessary
          regex += "([^\\/?&]+)" +(match[2]?"?":"");
          num++;
        }
        regex += "/";
        route = regex;
      }
      // detect if this route a regex (just checks for slashes right now)
      if(route.match(/^\/(.+?[^\\]\/)+\w*$/)){
        // convert to regexp object
        var pattern = route.replace(/^\/(.+?)\/\w*$/,"$1").replace(/(\\)/,"$1"),
            flags = route.replace(/^\/.+?\/(\w*)$/,"$1");
        route = new RegExp(viewName + '/' +pattern,flags);
      } else if(!~_.indexOf(raw,viewName)) {
        route = viewName + ((route) ? '/' + route : "");
      }
      viewRoutes[viewName] = route;
      viewNum ++;
    }
    // build an object for the client to interact with
    var app = {
      views : views,
      router : router,
      start : router.start,
      defaultRoute : function(){
        this.show();
      }
    };
    // loop through views and set up the basics.
    for(var name in views){
      var view = views[name];
      if(!view){
        if(typeof console !== 'undefined') console.error('Failed Loading view %s',name);
      } else {
        view.router = router;
        view.routePath = viewRoutes[name]
        router.route(viewRoutes[name],name,_.bind(function(){
          if(this.route){
            this.route.apply(this,arguments);
          } else {
            app.defaultRoute.apply(this,arguments);
          }
        },view));
        view.initialize()
      }
    }
    return app;
  });