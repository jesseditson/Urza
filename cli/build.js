// Build Commands
// ---

// Dependencies
// ---
var grunt = require('grunt'),
    helpers = require('./helpers'),
    getViews = require('../lib/helpers/middleware/views.js').getViews,
    fs = require('fs'),
    path = require('path'),
    wrench = require('wrench'),
    async = require('async')

// Helpers
// ---

// setup
var setup = function(){
  grunt.loadTasks(__dirname + '/../node_modules/grunt/tasks');
  // load custom tasks here
  //grunt.loadTasks(__dirname + '/tasks');
  // Initialize grunt with our own grunt.js config.
  // TODO: allow overrides
  require(__dirname + '/../grunt')(grunt);
  // Hacky workaround for proper grunt initialization
  // reference: https://github.com/cowboy/grunt/issues/189
  grunt.tasks([], {'version': true});
}

// Main command
module.exports = function(program){
  program
  .command('build')
  .description('Builds the current urza app.')
  .action(function(type,info){
    // set grunt's dir to the urza dir
    grunt.file.setBase(__dirname + '/..')
    setup()
    
    // set working dir to closest .urza dir
    var workingDir = helpers.getAppRoot()
    
    // make sure we don't delete anything important
    var scratchDir = workingDir + '/__urza_scratch'
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
    },function(){
      grunt.tasks(['build'])
    })
  });
}