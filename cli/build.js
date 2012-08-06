// Build Commands
// ---

// Dependencies
// ---
var grunt = require('grunt')

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
    grunt.tasks(['build'])
  });
}