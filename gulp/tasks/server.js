var gulp = require('gulp');
var nodemon = require('nodemon');
var browserSync = require('browser-sync');
var config = require('../config').server

var BROWSER_SYNC_RELOAD_DELAY = 500;

gulp.task('server', function(cb) {
  // require('child_process').spawn('nodemon');

  var nodemon = require('nodemon');

  nodemon({
    script: './bin/www',
    ignore: config.ignore
  });

  nodemon.on('start', function() {
    console.log('App has started');
  }).on('quit', function() {
    console.log('App has quit');
  }).on('restart', function(files) {
    console.log('App restarted due to: ', files);
    setTimeout(function reload() {
      browserSync.reload({
        stream: false //
      });
    }, BROWSER_SYNC_RELOAD_DELAY);
  });
  // var called = false;
  // return nodemon({
  //     tasks: [],
  //     ignore: config.ignore,

  //     // nodemon our expressjs server
  //     // script: 'bin/www',

  //     // watch core server file(s) that require server restart on change
  //     // watch: config.watch
  //   })
  //   .on('start', function onStart() {
  //     // ensure start only got called once
  //     if (!called) {
  //       cb();
  //     }
  //     called = true;
  //   })
  //   .on('restart', function onRestart() {
  //     console.log('Restarting...')
  //     // reload connected browsers after a slight delay
  //     setTimeout(function reload() {
  //       browserSync.reload({
  //         stream: false //
  //       });
  //     }, BROWSER_SYNC_RELOAD_DELAY);
  //   })
  //   .on('crash', function onCrash() {
  //     console.log('CRASHED!!!!');
  //   });
});