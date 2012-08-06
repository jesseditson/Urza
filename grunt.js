/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      lib: ['*.js','lib/**/*.js','test/**/*.js'],
      client : ['client/js/external/app.js','client/js/lib/**/*.js']
    },
    qunit: {
      files: ['test/**/*.html']
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:lib/<%= pkg.name %>.js>'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    jshint: {
      options: {
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
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'lint qunit concat min');

};
