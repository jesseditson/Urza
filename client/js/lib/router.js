define(['Backbone'],function(Backbone){
  // Router Class
  // Basically just a wrapper for the backbone router, which obscures backbone's annoying syntax.
  var Router = function(routes){
    this.routeObject = routes || {};
    var router = Backbone.Router.extend(this.routeObject);
    this.router = new router();
    this.onLeave;
  };
  // Override the Backbone loadUrl method to allow us to respond to ALL hashchange events.
  var backboneLoadUrl = Backbone.History.prototype.loadUrl;
  Backbone.History.prototype.loadUrl = function(){
    hashChanged.apply(this.router,arguments);
    backboneLoadUrl.apply(this,arguments);
  }
  
  // helpers
  var hashChanged = function(){
    if(this.onLeave){
      this.onLeave();
      delete this.onLeave;
    }
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
    this.router.navigate.apply(this.router,arguments);
  }
  // start method - use after all routes are in place.
  Router.prototype.start = function(){
    Backbone.history.router = this;
    Backbone.history.start({pushState: true});
  }
  return Router;
});