var gulp = require('gulp');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var config = require('../config').gulp;
var reload = require('browser-sync').reload;

gulp.task('default', ['server', 'client']);