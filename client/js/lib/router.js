define(['external/require-backbone'],function(Backbone){
  // Router Class
  // Basically just a wrapper for the backbone router, which obscures backbone's annoying syntax.
  // make router available in private methods
  var Router = function(routes){
    this.routeObject = routes || {};
    var router = Backbone.Router.extend(this.routeObject);
    this.router = new router();
    this.history = [];
    this.lastpage = "";
  };
  // Override the Backbone loadUrl method to allow us to respond to ALL hashchange events.
  var backboneLoadUrl = Backbone.History.prototype.loadUrl;
  Backbone.History.prototype.loadUrl = function(){
    hashChanged.apply(this.router,arguments);
    backboneLoadUrl.apply(this,arguments);
  }
  
  // helpers
  var hashChanged = function(){
    if(this.router.preventNext){
      delete this.router.preventNext;
    } else {
      this.router.lastpage = this.router.history[this.router.history.length-1] || "";
    }
    this.router.history.push(window.location.pathname);
    if(this.onLeave){
      this.onLeave();
      delete this.onLeave;
    }
  }
  // back - navigates backwards in history
  Router.prototype.back = function(){
    this.lastpage = this.history.pop();
    this.preventNext = true;
    var page = this.history.pop();
    this.navigate(page,{trigger:true,replace:false});
  }
  // callback to execute when we leave the currentPage
  Router.prototype.cleanup = function(action,context){
    this.onLeave = _.bind(action,context || this);
  }
  // add route
  // just exposes the router route method.
  Router.prototype.route = function(){
    this.router.route.apply(this.router,arguments);
  }
  Router.prototype.navigate = function(){
    var args = Array.prototype.slice.call(arguments)
    // default to true for navigate and trigger
    if(!args[1]){
      args[1] = {trigger: true, replace: false};
    } else {
      if(args[1].trigger !== false) args[1].trigger = true;
      if(args[1].replace !== false) args[1].replace = true;
    }
    return this.router.navigate.apply(this.router,args);
  }
  // start method - use after all routes are in place.
  Router.prototype.start = function(){
    Backbone.history.router = this;
    Backbone.history.start({pushState: true});
  }
  return Router;
});