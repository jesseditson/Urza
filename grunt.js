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
  grunt.registerTask('removeScratchDir','Removes the urza scratch dir',function(){
    console.log('Removing previous scratch dir')
    wrench.rmdirSyncRecursive(scratchDir)
  })
  
  // load up require plugin
  grunt.loadNpmTasks('grunt-requirejs');
  
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
        }
      ]
    }
  }
  // clone the web config (using JSON methods because speed is not an issue here)
  requireConfigs.mobile = JSON.parse(JSON.stringify(requireConfigs.web))
  requireConfigs.mobile.paths['lib/viewRoutes'] = scratchDir + '/views_mobile'
  requireConfigs.mobile.dir = workingDir + '/public_mobile'

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
      lib : [workingDir+'/*.js',workingDir+'/lib/**/*.js'],
      client : [workingDir+'/client/js/**/*.js']
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
  
  // TODO: concat + minify css
  
  grunt.initConfig(gruntConfig);

  // Default task.
  grunt.registerTask('default', 'lint');
  grunt.registerTask('build', 'lint generateViewFiles requirejs:web requirejs:mobile removeScratchDir')
};
