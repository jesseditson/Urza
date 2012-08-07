// CLI Global Helpers
// ---

// Dependencies
// ---
var path = require('path')

// Local Vars
// ---
var appRoot

var getAppRoot = module.exports.getAppRoot = function(dir){
  if(appRoot) return appRoot;
  // looks up the directory tree until it finds a folder with a .urza file.
  dir = dir ? dir.replace(/\/[^\/]+$/,'') : process.env.PWD;
  if(!dir.length){
    console.error('Urza app not found. Please run from inside an Urza app.');
    process.exit(1);
    return false;
  } else if(!path.existsSync(dir + '/.urza')){
    return getAppRoot.call(this,dir);
  } else {
    appRoot = dir;
    return dir;
  }
}


module.exports.parseJSON = function(string){
  var res = false;
  try {
    res=JSON.parse(string);
  } catch(e){
    //console.warn('failed first try to parse JSON: %s',e.message);
    try {
      string = string.replace(/'/g,'"');
      res=JSON.parse(string);
    } catch(e){
      console.error('FAILED PARSING: %s',string);
      throw e;
    }
  }
  return res;
}