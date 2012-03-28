// Dependencies
// ------------

var request = require('request'),
  _ = require('underscore'),
  logger = require('../logging/logger.js'),
  config = require('config');

// Local (Private) Variables
// -------------------------
var fb_access_token,
  // each of these actions will become callable as Facebook.<action>(user,callback);
  graph_actions = ["friends","user"];

// Facebook Class
// --------------

var Facebook = module.exports = function(){
  this.graphUrl = "https://graph.facebook.com";
  graph_actions.forEach(function(action){
    // don't allow hamfisted overrides
    if(this[action]) return;
    // make this a method
    this[action] = function(user,token,options,callback){
      if(!callback){
        callback = options;
        options = {};
      }
      this.get.call(this,action,user,token,options,callback);
    }
  }.bind(this));
}

// Helper Methods
// --------------

// returns (and caches) the facebook access token
Facebook.prototype.getToken = function(callback){
  if(fb_access_token){
    callback(null,fb_access_token);
  } else {
    request('https://graph.facebook.com/oauth/access_token?client_id='+config.facebookAppId+'&client_secret='+config.facebookAppSecret+'&grant_type=client_credentials',function(err,response){
      if(err){
        logger.error("Failed to retrieve FB Access Token!",err);
        callback(err);
      } else {
        fb_access_token = response.body.replace(/^access_token=/,'');
        callback(err,fb_access_token);
      }
    }.bind(this));
  }
}

// main action url - calls to a facebook url.
Facebook.prototype.graph = function(options,callback,cData){
  var cData = cData || [],
    done = function(token){
      // build a url or take it from the options
      var data = {}, method = "GET";
      if(options.url){
        var url = options.url;
      } else if(options.action == "batch") {
        var url = this.graphUrl, method = "POST";
        var batchData = options.batch.map(function(b){
          var bUrl = b.user_id;
          if(b.action && b.action != "user") bUrl += '/' + b.action;
          // TODO: handle query string
          return { "method" : "GET", "relative_url" : bUrl};
        });
        data.batch = batchData;
        data.access_token = token;
      } else {
        var url = this.graphUrl + '/' + options.user_id;
        // if action is user, we don't need the action param
        if(options.action && options.action != "user") url +=  '/' + options.action;
        url += "?access_token=" + token;
        if(options.params){
          for(var p in options.params){
            url += '&' + p + "=" + options.params[p];
          }
        }
      }
      var reqOpts = {
        'uri' : url,
        'method' : method
      };
      if(method == "POST") reqOpts.body = JSON.stringify(data);
      request(reqOpts,function(err,req){
        if(!err) var response = JSON.parse(req.body);
        if(err || response.error){
          logger.error("Failed to retrieve graph action.",err || response.error.message);
          callback(err || new Error(response.error.message));
        } else {
          if(Array.isArray(response.data)){
            cData = cData.concat(response.data);
          } else {
            cData = response;
          }
          if(!err && response.paging && response.paging.next){
            this.graph({url:response.paging.next},callback,cData);
          } else {
            callback(err,cData);
          }
        }
      }.bind(this));
    }.bind(this);
  // get the token
  if(options.token){
    done(options.token);
  } else {
    this.getToken(function(err,gtoken){
      done(gtoken);
    }.bind(this));
  }
}

// Graph API Methods
// -----------------
// unless specified, these methods take either a user object or a user id, and a callback that will return (err,json).

// **get**
// for unspecial queries, you can either call a helper or get if there is no helper.
// helpers are automatically added from the graph array at instantiation.
Facebook.prototype.get = function(action,user,token,options,callback){
  var id = user.id || user;
  // make the token optional
  if(!callback && typeof options == 'function'){
    callback = options;
    options = token;
    token = false;
  }
  this.graph(_.extend(options,{user_id:id,action:action,token:token}),callback);
}

// get location details from facebook graph
Facebook.prototype.locationDetails = function(locationId,callback) {
  var url = this.graphUrl + "/" + locationId;
  request(url,function(err,response){
    callback(err,response.body);
  })
}