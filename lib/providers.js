// ##Dependencies

var MongoDB = require('./mongodb.js'),
    config = require('config'),
    walk = require('./helpers/walk.js');

// #Providers Class
// Main providers class.
// providers will inherit methods defined on the main mongodb class.
// exposes all the providers directly on this class.
// Note: this class must not have any methods, as they may conflict with provider names.

var Providers = module.exports = function(ready){
  var mongodb = new MongoDB(config),
      methods = MongoDB.prototype;
  loadProviders(function(providers){
    // add mongodb methods to all providers
    for(var p in providers){
      var Provider = providers[p];
      for(var m in methods){
        // Add native mongo methods to the provider.
        if(!Provider.prototype[m]){
          Provider.prototype[m] = function(){
            // create a prefilled method with the provider name (and model)
            var args = Array.prototype.slice.call(arguments),
                method = args.shift();
            return methods[method].apply(mongodb,args);
          }.bind(this,m,p);
        } else {
          //console.warn('Provider "%s" overrides native method "%s".',p,m);
        }
      }
      this[p] = new Provider(mongodb);
    }
    if(ready) ready();
  }.bind(this));
}

// Load Providers
// --------------
// loads in providers based on filename in the current and sub directories
// ignores this file and mongodb class, as well as the models folder.
var loadProviders = function(callback){
  var providers = {},
      ignore = [];
  walk('./lib/providers',function(file,folder){
    // ignore this file and mongodb.
    if((folder == __dirname && ignore.indexOf(file)==-1) && folder != 'models'){
      providers[file.replace(/\.js$/,'')] = require(folder + '/' + file);
    }
  },function(){
    callback(providers);
  });
}