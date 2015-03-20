var gulp = require('gulp');
var spawn = require('child_process').spawn;
var config = require('../config').gulp;
var reload = require('browser-sync').reload;

gulp.task('default', ['server', 'client'], function() {
  // var p;
  // gulp.watch(config.watch, spawnChildren);

  spawn('mongod');

  // function spawnChildren(e) {
  //   if (p) {
  //     p.kill();
  //   }
  //   p = spawn('gulp', {
  //     stdio: 'inherit'
  //   });
  // };
});