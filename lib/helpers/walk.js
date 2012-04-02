// Dependencies
// ------------
var fs = require('fs'),
  _ = require('underscore');

// **Walk**
// walks files from a folder if filter returns true (or if filter is omitted.);
var loadFiles = module.exports = function(folder,filter,callback,currentObj){
  if(!currentObj && typeof callback === "undefined"){
    // callback wasn't passed in.
    callback = filter;
    filter = function(){ return true; }
  } else if(!currentObj && !callback){
    // callback was set to false
    callback = function(){};
  }
  var obj = currentObj || {};
  fs.readdir(folder,function(err,files){
    if(err){
      callback({});
    } else {
      var done = _.after(files.length,function(t){ callback(t); });
      if(err){
        // TODO: handle errors
      } else {
        files.forEach(function(file){
          var filePath = folder + "/" + file;
          fs.stat(filePath,function(err,stats){
            if(stats.isDirectory()){
              obj[folder] = {};
              loadFiles(filePath,filter,done,obj[folder]);
            } else if(stats.isFile()){
              if(filter(file,folder)){
                obj[file] = file;
              }
              done(obj);
            } else {
              done(obj);
            }
          });
        });
      }
    }
  });
}
