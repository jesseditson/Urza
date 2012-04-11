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
  // create an object to store collection defaults in.
  MongoDB.prototype.collectionDefaults = {};
  loadProviders(function(providers){
    // add mongodb methods to all providers
    for(var p in providers){
      var Provider = providers[p];
      for(var m in methods){
        // Add native mongo methods to the provider.
        if(m == 'findOperation'){
          // don't allow overriding of findOperation, also default to the fields specified in this provider.
          if(!Provider.prototype.defaultFields || !Array.isArray(Provider.prototype.defaultFields)){
            console.warn('Warning: %s.prototype.defaultFields does not exist or is not an array. Using full result set.',p);
          } else {
            MongoDB.prototype.collectionDefaults[p] = Provider.prototype.defaultFields;
          }
        } else if(!Provider.prototype[m]){
          Provider.prototype[m] = function(){
            // create a prefilled method with the provider name (and model)
            var args = Array.prototype.slice.call(arguments),
                method = args.shift();
            return methods[method].apply(mongodb,args);
          }.bind(this,m,p);
        } else {
          console.warn('Provider "%s" overrides native method "%s".',p,m);
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
var loadProviders = function(callback){
  var providers = {};
  walk(process.cwd() + '/lib/providers',function(file,folder){
    if(!folder.match(/schemas$/)){
      providers[file.replace(/\.js$/,'')] = require(folder + '/' + file);
    }
  },function(){
    callback(providers);
  });
}