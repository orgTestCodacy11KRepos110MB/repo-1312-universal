/* jshint node:true */

/// <reference path="../../typings/node/node.d.ts"/>
'use strict';

// Load deps

var gulp = require('gulp');
var path = require('path');
var http = require('http');
var fs = require('fs');
var child_process = require('child_process');

var $ = require('gulp-load-plugins')({
	pattern: [
		'gulp-*',
		'gulp.*',
		'del',
		'run-sequence',
		'conventional-changelog',
		'jasmine-*',
		'karma',
		'serve-*',
		'opn',
		'browser-sync'
	]
});

// Utilities

function getProtractorBinary(binaryName){
  var winExt = /^win/.test(process.platform)? '.cmd' : '';
  var pkgPath = require.resolve('protractor');
  var protractorDir = path.resolve(path.join(path.dirname(pkgPath), '..', 'bin'));
  return path.join(protractorDir, '/'+binaryName+winExt);
}

// configuration

var livereloadport = 35729;
var serverport = 3000;
var serverip = 'localhost';
var tsProject = $.typescript.createProject(path.join(__dirname + '/tsconfig.json'));
var paths = {

	config: {
		karma: path.join(__dirname + '/karma.conf.js'),
		protractor: path.join(__dirname + '/protractor.conf.js')
	},

	cleanable: [
    './dist/',
    './tsd_typings/',
    './node_modules/angular2/',
    './angular/modules/angular2/typings/',
    './angular/dist/',
    './web_modules/'
  ].map(function(p){ return path.join(__dirname, p); }),

	files: {
		ts: ['./modules/**/*.ts', './examples/**/*.ts']
	},

  preboot: {
    server: path.join(__dirname, '/dist/modules/preboot/server'),
    dest: path.join(__dirname, './examples/preboot_basic')
  },

  changelog: {
    filename: path.join(__dirname, 'CHANGELOG.md')
  },

  serverIndex : path.join(__dirname + '/index.js'),

  specs: ['dist/**/*_spec.js']

};

// Tasks definitions

gulp.task('default', function(done){

	return $.runSequence(
		'lint',
		'karma',
		done
	);

});

gulp.task('build', ['build.preboot']);

gulp.task('build.preboot', function(){

	var preboot = require(paths.preboot.server);

  return preboot.getClientCodeStream({
    appRoot:  'app',         // selector for root element
    freeze:   'spinner',     // show spinner w button click & freeze page
    replay:   'rerender',    // rerender replay strategy
    buffer:   true,          // client app will write to hidden div until bootstrap complete
    debug:    true,
    uglify:   false,
    presets:  ['keyPress', 'buttonPress', 'focus']
  })
  .pipe($.size())
  .pipe(gulp.dest(paths.preboot.dest));
});

gulp.task('build.typescript', ['build.typescript.project']);

gulp.task('build.typescript.project', function(){

  return tsProject.src()
    .pipe($.typescript(tsProject))
    .pipe($.size())
    .pipe(gulp.dest(tsProject.config.compilerOptions.outDir));

});

gulp.task('build.typescript.all', function(){

  return gulp.src(paths.files.ts)
    .pipe($.typescript(tsProject))
    .pipe($.size())
    .pipe(gulp.dest(tsProject.config.compilerOptions.outDir));
});

gulp.task('changelog', function(){

  return $.conventionalChangelog({
    preset: 'angular'
  })
  .pipe(fs.createWriteStream(paths.changelog.filename));

});

gulp.task('clean', function(){

  return $.del(paths.cleanable, function (err, paths) {
    if(paths.length <= 0){
      console.log('Nothing to clean.')
    }
    else {
      console.log('Deleted folders:\n', paths.join('\n'));
    }
  });

});

gulp.task('debug', function(){

  return gulp.src(paths.serverIndex).pipe($.nodeInspector());

});

gulp.task('jasmine', function(){

  return gulp.src(paths.specs)
    .pipe($.jasmine({
      reporter: new $.jasmineReporters.TerminalReporter({
        verbose: 3,
        showStack: true,
        color: true
      })
    }));

});

gulp.task('karma', function(done){

  return new $.karma.Server({
    configFile: paths.config.karma,
    singleRun: true
  }, done).start();

});

gulp.task('protractor', function(){

	return gulp.src(paths.specs)
    .pipe($.protractor.protractor({
      configFile: paths.config.protractor
    }))
  	.on('error', function(e) { throw e })

})

gulp.task('protractor.start', function(done){

	return $.protractor.webdriver_standalone(done);

});

gulp.task('protractor.update', function(done){

	child_process.spawn(getProtractorBinary('webdriver-manager'), ['update'], {
    stdio: 'inherit'
  }).once('close', done);

});

gulp.task('lint', function(){

	return gulp.src(paths.files.ts)
    .pipe($.tslint())
		.pipe($.tslint.report('verbose'));

});

// @todo figure out what "play" should do!
gulp.task('play', ['!browser-sync'], function() {
  //$.opn('http://'+serverip+':' + serverport + '/');
});

// @todo figure out what "play.preboot" should do!
gulp.task('play.preboot', ['!browser-sync'], function() {
  //$.opn('http://'+serverip+':' + serverport + '/preboot_basic/preboot.html');
});

gulp.task('!browser-sync', function() {
  $.browserSync.init({
  	online: false,
  	logLevel: 'debug',
  	logPrefix: 'Universal',
    server: {
      baseDir: ['./examples'],
      index: './examples',
      directory: true,
      ghostMode: false
  	},
  	files: [
      './examples/**/*.js'
    ],
    watchOptions: {
      ignored: ['*.js.map', '*_spec.js']
    },
  	port: 3002,
  	host: serverip
  });
});


// "serve" defaults to nodemon for the moment.
gulp.task('serve', ['!serve.nodemon']);

gulp.task('!serve.nodemon', function(){

  $.livereload.listen();

  return $.nodemon({
    verbose: true,
    script: paths.serverIndex,
    ext: 'js ts html',
    ignore: ['\\.git', 'node_modules', '*.js.map', '*_spec.js', 'angular']
  })
  //.on('change', ['serve:watch'])
  .on('restart', function(){
    gulp.src('index.js')
      .pipe($.livereload())
      .pipe($.notify('Reloading page, please wait...'));
  });
});








