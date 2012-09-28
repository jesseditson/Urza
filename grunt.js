/*global module:false*/
module.exports = function(grunt) {
  // deps 
  var helpers = require('./cli/helpers'),
      fs = require('fs'),
      path = require('path'),
      wrench = require('wrench'),
      async = require('async'),
      getViews = require('./lib/helpers/middleware/views.js').getViews
  
  // set working dir to closest .urza dir
  var workingDir = helpers.getAppRoot()
  var scratchDir = workingDir + '/__urza_scratch'
  // set up config dir so grunt will use the config client config.
  process.env.NODE_CONFIG_DIR = workingDir + '/config';
  var config = require('config-heroku')
  var packageInfo = JSON.parse(fs.readFileSync(workingDir + '/package.json','utf8'))
  
  // set up grunt task to create scratch dir
  grunt.registerTask('generateViewFiles','generates scratch dir and puts views in them.',function(){
    var done = this.async();
    if((fs.existsSync || path.existsSync)(scratchDir)){
      console.log('Removing previous scratch dir')
      wrench.rmdirSyncRecursive(scratchDir)
    }
    
    // make a scratch directory
    console.log('creating scratch dir')
    fs.mkdirSync(scratchDir)
    
    // export new views.js files for each of our build scripts
    console.log('generating temp views.js files')
    async.forEach(['web','mobile'],function(type,done){
      getViews(type,function(err,str){
        fs.writeFile(scratchDir + '/views_'+type+'.js',str,'utf8',done)
      })
    },done)
  })
  // set up grunt task to delete temp dir
  grunt.registerTask('cleanup','Removes the urza scratch dir',function(){
    console.log('Cleaning up...')
    wrench.rmdirSyncRecursive(scratchDir)
    wrench.rmdirSyncRecursive(workingDir + '/public')
    wrench.rmdirSyncRecursive(workingDir + '/public_web')
    wrench.rmdirSyncRecursive(workingDir + '/public_mobile')
  })
  // set up grunt task to upload to s3
  grunt.registerTask('uploadToS3','uploads built public_web dir to S3',function(){
    var done = this.async()
    if(!config.aws){
      throw new Error("You must specify a 'config.aws' object with keys: 'awsPrivateKey', 'awsKey', 'staticBucket', and 'bucketRegion' to use s3 uploads.")
    } else {
      var s3Config = {
            key : config.aws.awsKey,
            secret : config.aws.awsPrivateKey,
            bucket : config.aws.staticBucket,
            region : config.aws.bucketRegion
          }
      s3Config = JSON.parse(JSON.stringify(s3Config))
      if(process.env.NODE_ENV === 'production'){
        s3Config.rootDir = '/' + packageInfo.version
      }
      console.log(s3Config)
      helpers.uploadToS3(s3Config,workingDir + '/public',done)
    }
  })
  // set up grunt task to merge mobile and web folders
  grunt.registerTask('mergePublicFolders','merges requirejs generated public folders',function(){
    console.log('merging generated public folders')
    var done = this.async()
    wrench.copyDirSyncRecursive(workingDir + '/public_web', workingDir + '/public')
    wrench.copyDirSyncRecursive(__dirname + '/client/js/vendor', workingDir + '/public/js/vendor')
    wrench.copyDirSyncRecursive(__dirname + '/client/js/external', workingDir + '/public/js/external')
    async.parallel([
      helpers.copyFile.bind(helpers,workingDir + '/public_mobile/js/client.js',workingDir + '/public/js/client_mobile.js'),
      helpers.copyFile.bind(helpers,workingDir + '/public_web/js/client.js',workingDir + '/public/js/client_web.js'),
      helpers.copyFile.bind(helpers,workingDir + '/public_mobile/js/public.js',workingDir + '/public/js/public_mobile.js'),
      helpers.copyFile.bind(helpers,workingDir + '/public_web/js/public.js',workingDir + '/public/js/public_web.js')
    ],function(){
      async.parallel([
        fs.unlink.bind(fs,workingDir + '/public/js/client.js'),
        fs.unlink.bind(fs,workingDir + '/public/js/public.js')
      ],done)
    })
  })
  
  // load up require plugin
  grunt.loadNpmTasks('grunt-requirejs');
  // load up css plugin
  grunt.loadNpmTasks('grunt-css');
  
  // Set up require conf
  var requireConfigs = {
    web : {
      appDir : workingDir + "/client",
      baseUrl : "js",
      dir : workingDir + "/public_web",
      optimize : "uglify",
      preserveLicenseComments: false,
      paths : {
        "lib/viewRoutes" : scratchDir + '/views_web',
        "jquery" : workingDir + "/node_modules/urza/client/js/vendor/require-jquery-min",
        "external/app" : workingDir + "/node_modules/urza/client/js/external/app",
        "lib/router" : workingDir + "/node_modules/urza/client/js/lib/router",
        "lib/view" : workingDir + "/node_modules/urza/client/js/lib/view",
        "vendor/require-backbone" : workingDir + "/node_modules/urza/client/js/vendor/require-backbone"
      },
      modules : [
        {
          name : "client",
          exclude: ['jquery']
        },
        {
          name : "public",
          exclude: ['jquery']
        }
      ]
    }
  }
  // clone the web config (using JSON methods because speed is not an issue here)
  requireConfigs.mobile = JSON.parse(JSON.stringify(requireConfigs.web))
  requireConfigs.mobile.paths['lib/viewRoutes'] = scratchDir + '/views_mobile'
  requireConfigs.mobile.dir = workingDir + '/public_mobile'
  
  // set up lint file paths
  var lintPaths = {
    lib : [workingDir+'/*.js',workingDir+'/lib/**/*.js'],
    client : [workingDir+'/client/js/*.js', workingDir+'/client/js/lib/**/*.js']
  }
  
  // ignore lint on files specified in lintignore
  var lintPath = workingDir + '/.lintignore',
      lintignore = (fs.existsSync || path.existsSync)(lintPath) ? fs.readFileSync(lintPath,'utf8') : false
  if(lintignore && lintignore.length){
    var ignorePattern = new RegExp("(" + lintignore.split(/\n/).join('|').replace(/\|$/,'') + ")")
    var addIgnores = function(paths){
      return grunt.file.expandFiles(paths).filter(function(p){
        return !ignorePattern.test(p)
      })
    }
    lintPaths.lib = addIgnores(lintPaths.lib)
    lintPaths.client = addIgnores(lintPaths.client)
  }
  
  // Project configuration.
  var gruntConfig = {
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      // Note: may not want these to run during client builds.
      urza_lib: ['*.js','lib/**/*.js','test/**/*.js'],
      urza_client : ['client/js/external/app.js','client/js/lib/**/*.js'],
      // client lint
      lib : lintPaths.lib,
      client : lintPaths.client
    },
    jshint: {
      options: {
        // Note: these appear to be completely overridden, not overloaded.
        curly: false,
        eqeqeq: false,
        forin: false,
        indent: 2,
        immed: true,
        latedef: true,
        newcap: true,
        nonew: true,
        regexp : true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        trailing: true,
        laxcomma: true
      },
      globals: {
        emit : true
      },
      urza_lib : {
        options : {
          onecase : true,
          asi: true,
          loopfunc: true,
          node:true
        }
      },
      urza_client : {
        options : {
          asi:true,
          loopfunc: true,
          boss: true,
          browser:true
        }
      },
      lib : {
        options : {
          onecase : true,
          asi: true,
          loopfunc: true,
          node:true
        }
      },
      client : {
        options : {
          asi:true,
          loopfunc: true,
          boss: true,
          browser:true
        }
      }
    },
    requirejs : {
      mobile : requireConfigs.mobile,
      web : requireConfigs.web
    }
  }
  
  // css config stuff
  if((fs.existsSync || path.existsSync)(workingDir + '/client/css/css.json')){
    var cssFiles
    var addCssPath = function(p){
      return workingDir + '/client/css/' + p
    }
    try {
      cssFiles = JSON.parse(fs.readFileSync(workingDir + '/client/css/css.json'))
    } catch(e){
      console.log('Could not find a css.json file in client/css - not concat & minifying css.')
    }
    if(cssFiles){
      gruntConfig.cssmin = {
        mobile : {
          src : cssFiles.all.concat(cssFiles.mobile).map(addCssPath),
          dest : workingDir + '/public/css/mobile.css'
        },
        web : {
          src : cssFiles.all.concat(cssFiles.web).map(addCssPath),
          dest : workingDir + '/public/css/web.css'
        }
      }
    }
  }
  // fix css image paths
  grunt.registerTask('fixCssImagePaths','replaces all css image paths with ones relative to generated css files',function(){
    var fixCssImagePaths = function(p){
      var file = workingDir + '/public/css/'+p+'.css'
      if(!(fs.existsSync || path.existsSync)(file)) return
      var css = fs.readFileSync(file,'utf8')
      css = css.replace(/url\((['"]?)(\.\.\/)*img/g,'url($1../img')
      fs.writeFileSync(file,css,'utf8')
    }
    fixCssImagePaths('mobile')
    fixCssImagePaths('web')
  })
  
  grunt.initConfig(gruntConfig);

  // Default task.
  grunt.registerTask('default', 'lint');
  grunt.registerTask('build', 'lint generateViewFiles requirejs:web requirejs:mobile mergePublicFolders cssmin fixCssImagePaths uploadToS3 cleanup')
};
