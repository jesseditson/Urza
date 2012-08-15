// Views
// ------
// serves up a views.js file depending on our requests' isMobile

// Dependencies
// ---
var walk = require('../walk'),
    fs = require('fs'),
    _ = require('underscore'),
    getAppRoot = require('../../../cli/helpers').getAppRoot

// Local Variables
// ---
var files = {
      base : [],
      web : [],
      mobile : []
    },
    viewArrays = {web : [], mobile : []},
    viewRoutes = {web : {}, mobile : {}},
    basePath = 'lib/views/',
    viewsFolder = getAppRoot() + '/client/js/lib/views',
    ready = false,
    readyCallbacks = [],
    searchFolders = ['web','mobile'],
    defineString = 'define({{{viewArray}}},function(){ return { views : arguments, routes : {{{viewRoutes}}} } });',
    viewsFiles = { web : "", mobile : "" }

// Helpers
// ---
var setup = function(callback){
  var appRoot = getAppRoot()
  // get the views object
  try {
    var views = JSON.parse(fs.readFileSync(appRoot + '/client/js/lib/views.json'))
  } catch(e) {
    throw new Error('Failed parsing client/js/lib/views.json file. Perhaps it is missing, or not a valid JSON object? Error: ' + e.message)
  }
  // grab all view js files, determine path, then create view array
  walk(viewsFolder,function(file,folderPath){
    var folder = folderPath.replace(viewsFolder,'').replace(/^\//,'')
    if(file.match(/\.js$/) && (!folder || ~searchFolders.indexOf(folder))){
      var viewName = file.replace(/\.js$/,'')
      if(!folder){
        files.base.push(viewName)
      } else {
        files[folder].push(viewName)
      }
    }
  },function(){
    // get unique views
    var viewNames = views.map(function(view){ return view.view }),
        allViews = _.union(files.base,files.web,files.mobile),
        missingViews = _.difference(viewNames,allViews),
        viewIndexes = {}
    for(var i=0;i<viewNames.length;i++){
      viewIndexes[viewNames[i]] = i
    }
    // sort allViews by indexes
    allViews = allViews.sort(function(a,b){
      return viewIndexes[a] - viewIndexes[b]
    })
    if(missingViews.length){
      // probably unnecessary grammar
      var p = missingViews.length == 1 ? 'view' : 'views',
          w = missingViews.length == 1 ? 'was' : 'were'
      ;(typeof logger !== 'undefined' ? logger : console).warn('WARNING: the '+p+' "' + missingViews.join('", "') + '" '+w+' defined, but no js files were found for them.')
    }
    // push the web, mobile, or default views to their respective arrays
    allViews.forEach(function(view){
      var webView = true
      if(~files.web.indexOf(view)){
        viewArrays.web.push(basePath + 'web/' + view)
      } else if(~files.base.indexOf(view)){
        viewArrays.web.push(basePath + view)
      } else {
        webView = false
      }
      var mobileView = true
      if(~files.mobile.indexOf(view)){
        viewArrays.mobile.push(basePath + 'mobile/' + view)
      } else if(~files.base.indexOf(view)){
        viewArrays.mobile.push(basePath + view)
      } else {
        mobileView = false
      }
      // also add an entry to the view routes (or default to no arguments)
      var viewIndex = viewIndexes[view],
          viewDefined = typeof viewIndex != "undefined"
      if(webView) viewRoutes.web[view] = viewDefined ? views[viewIndex].route : ""
      if(mobileView) viewRoutes.mobile[view] = viewDefined ? views[viewIndex].route : ""
    })
    // all done. Catch up & mark ready.
    ready = true
    readyCallbacks.forEach(function(cb){ cb() })
    if(callback) callback()
  })
}

var middleware = module.exports.middleware = function(req,res,next){
  // only respond to requests for views.js
  if(!req.url.match(/^\/js\/lib\/viewRoutes\.js/)) return next()
  // make sure we're ready before doing anything
  if(!ready) return readyCallbacks.push(middleware.bind(this,req,res,next))
  // attempt to spit out the cached views file string
  // set application type
  res.setHeader('Content-Type','application/javascript')
  if(req.isMobile===true){
    getViews('mobile',function(err,viewString){
      res.send(viewString)
    })
  } else {
    getViews('web',function(err,viewString){
      res.send(viewString)
    })
  }
}

var getViews = module.exports.getViews = function(type,callback,fail){
  // make sure we're ready before doing anything
  if(!ready) return readyCallbacks.push(getViews.bind(this,type,callback))
  if(viewsFiles[type].length){
    return callback(null,viewsFiles[type])
  } else if(!fail) {
    // need to generate views files
    viewsFiles.web = defineString.replace('{{{viewArray}}}',JSON.stringify(viewArrays.web)).replace('{{{viewRoutes}}}',JSON.stringify(viewRoutes.web))
    viewsFiles.mobile = defineString.replace('{{{viewArray}}}',JSON.stringify(viewArrays.mobile)).replace('{{{viewRoutes}}}',JSON.stringify(viewRoutes.mobile))
    // try again
    return getViews.call(this,type,callback,true)
  } else {
    return callback(new Error("Failed attempting to load views for " + type + "."))
  }
}

// start processing as soon as this file is loaded
setup()