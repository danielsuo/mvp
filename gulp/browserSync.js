var browserSync = require('browser-sync');
var gulp = require('gulp');

gulp.task('browserSync', function() {
	browserSync({
		proxy: 'http://localhost:8080',
		notify: true
	});
});