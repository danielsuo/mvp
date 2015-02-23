var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var reload = require('browser-sync').reload;

var BROWSER_SYNC_RELOAD_DELAY = 100;

gulp.task('nodemon', function(callback) {
	var called = false;

	return nodemon({
			script: 'server.js',
			watch: ['server.js']
		})
		.on('start', function() {
			if (!called) {
				callback();
			}
			called = true;
		})
		.on('restart', function() {
			console.log('restarted!');
			setTimeout(function() {
				reload({
					stream: false //
				});
				console.log('browserSync')
			}, BROWSER_SYNC_RELOAD_DELAY);
		});
});