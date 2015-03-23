var gulp = require('gulp');
var nodemon = require('nodemon');
var browserSync = require('browser-sync');
var config = require('../config').server

var BROWSER_SYNC_RELOAD_DELAY = 1500;

gulp.task('server', function(cb) {

  // var p;
  // gulp.watch(config.watch, spawnChildren);

  // function spawnChildren(e) {
  //   if (p) {
  //     p.kill();
  //   }
  //   p = spawn('gulp', {
  //     stdio: 'inherit'
  //   });
  // };

  require('child_process').spawn('mongod');
  require('child_process').exec(__dirname + '/../../update')

  var nodemon = require('nodemon');

  nodemon({
    script: './bin/www',
    ignore: config.ignore,
    verbose: 'true',
    ext: 'js html'
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
  })
  // .on('exit', function() {
  //   console.log('App has exited');
  // }).on('crash', function() {
  //   console.log('App has crashed');
  // });
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