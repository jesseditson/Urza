// Dependencies
// ------------
var config = require('config'),
  async = require('async'),
  fs = require('fs'),
  path = require('path'),
  walk = require('./helpers/walk.js');

// Local Variables
// ---------------

var Providers = require('./providers.js');

// Main API Class
// --------------

var Api = module.exports = function(options){
  this.ready = false;
  // set up endpoints
  this.endpoints = {};
  var apidir = (options && options.apidir) ? options.apidir : process.cwd() + '/lib/api';
  walk(apidir,function(file,folder){
    this.endpoints[file.replace(/\.js$/,'')] = require(folder + '/' + file);
  }.bind(this),function(){
    this.providers = new Providers(options,function(){
      this.ready = true;
      if(this.readycallback) this.readycallback(this);    
    }.bind(this));
  }.bind(this));
}

// Routing
// -------

// **Find Route**
// Recursively searches endpoints for methods.
// Requires that endpoint is set on the Api Class, but every child can either be an object
// or a method. if it is a method, it will always handle the class.
// if there is a default method set on the object, it will be called if there are no params.
// otherwise, it will call the route descending down the params.
var findRoute = function(endpoint,params,session,body,callback){
  var action = params.shift(),
    route = function(method,args){
      method.apply(this,[session,body,callback].concat(args || []));
    }.bind(this);
  if(typeof endpoint === 'function'){
    // the endpoint itself is a function, call it.
    route(endpoint);
  } else if(!endpoint || !endpoint[action]){
    // this level or endpoint does not exist...
    if(!endpoint){
      // and it's because the endpoint is missing.
      callback(new Error("Invalid Endpoint"));
    } else if(!action && typeof endpoint.default === 'function'){
      // however, we do have a default for this level. call it.
      route(endpoint.default);
    } else {
      // and there is no default method. This url is invalid.
      callback(new Error("Invalid Action"));
    }
  } else if(typeof endpoint[action] === 'function'){
    // the endpoint called is a method. call it.
    route(endpoint[action],params);
  } else if(typeof endpoint[action] === 'object'){
    // the endpoint called is an object. Descend into it.
    findRoute.call(this,endpoint[action],params,session,body,callback);
  }
}

// **Main Route Method**
// all routes pass through this one.
Api.prototype.route = function(params,session,body,callback){
  var doRoute = function(){
      var endpoint = this.endpoints[params.shift()];
      findRoute.call(this,endpoint,params,session,body,callback);
    }.bind(this);
  // prevent this from being fired before the class has finished initializing.
  if(!this.ready){
    this.readycallback = doRoute;
  } else {
    doRoute();
  }
}