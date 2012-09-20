// CLI Global Helpers
// ---

// Dependencies
// ---
var path = require('path'),
    walk = require('../lib/helpers/walk'),
    async = require('async'),
    fs = require('fs')

// Local Vars
// ---
var appRoot

var getAppRoot = module.exports.getAppRoot = function(dir){
  if(appRoot) return appRoot;
  // looks up the directory tree until it finds a folder with a .urza file.
  dir = (dir ? dir.replace(/\/[^\/]+$/,'') : process.env.PWD || process.cwd())
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

var knox = require('knox')

module.exports.copyFile = function(old,newPath,callback){
  var newFile = fs.createWriteStream(newPath);
  var oldFile = fs.createReadStream(old);
  oldFile.on('end',callback)
  oldFile.pipe(newFile)
}

var getFileType = function(file){
  var ext = file.replace(/^.+?\.([\w\d]+)$/,'$1')
  switch(ext){
    case 'css' :
      return 'text/css'
      break
    case 'js' :
      return 'application/javascript'
      break
    case 'jpeg' :
      return 'image/jpeg'
      break
    case 'jpg' :
      return 'image/jpeg'
      break
    case 'gif' :
      return 'image/gif'
      break
    case 'txt' :
      return 'text/plain'
      break
    case 'png' :
      return 'image/png'
      break
    case 'html' :
      return 'text/html'
      break
    case 'json' :
      return 'application/json'
      break
    case 'pdf' :
      return 'application/pdf'
      break
    case 'zip' :
      return 'application/zip'
      break
    case 'ico' :
      return 'image/vnd.microsoft.icon'
      break
    case 'csv' :
      return 'text/csv'
      break
    case 'eot' :
      return 'application/vnd.ms-fontobject'
      break
    case 'ttf' :
      return 'font/ttf'
      break
    case 'otf' :
      return 'font/opentype'
      break
    case 'woff' :
      return 'application/x-font-woff'
      break
    case 'svg' :
      return 'image/svg+xml'
      break
    default :
      return 'application/octet-stream'
      break
  }
}

module.exports.uploadToS3 = function(options,filePath,callback){
  // set up s3 config
  var s3Config = {
    key : options.key,
    secret : options.secret,
    bucket : options.bucket,
    region : '-' + options.region || "-us-west-2"
  }
  var rootDir = options.rootDir || ''
  // set up knox client
  var client = knox.createClient(s3Config)
  var uploads = {}
  if(filePath.match(/\.[\w\d]+$/)){
    // TODO: if passed filePath is a file, just put it up there.
    console.error("I don't know how to upload single files yet.")
  } else {
    // build an object of files to upload
    walk(filePath,function(file,folderPath){
      var folder = folderPath.replace(filePath,'').replace(/^\//,'')
      uploads[folderPath + '/' + file] = rootDir + ('/' + folder + '/' + file).replace(/^\/\//,'/')
    },function(){
      async.forEachLimit(Object.keys(uploads),100,function(fromPath,done){
        var toPath = uploads[fromPath]
        fs.readFile(fromPath,function(err,buf){
          var req = client.put(toPath,{
            'Content-Length' : buf.length,
            'Content-Type' : getFileType(toPath)
          })
          req.on('response',function(res){
            if(res.statusCode == 200){
              console.log('Finished Uploading %s, content type %s',toPath,getFileType(toPath))
              done(null)
            } else if(res.statusCode == 404){
              done(new Error("Bucket not found."))
            } else {
              var body = ""
              res.setEncoding("utf8")
              res.on('data',function(chunk){
                body += chunk
              })
              res.on('end',function(){
                console.error(body)
                done(new Error("Unknown error uploading to s3."))
              })
            }
          })
          req.end(buf)
        })
      },callback)
    })
  }
}
