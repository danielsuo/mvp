var gulp = require('gulp');
var stylus = require('gulp-stylus');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('css', function() {
	gulp.src('./assets/css/**/*.css')
		.pipe(gulp.dest('site/css/'));

  gulp.src('./assets/css/**/*.styl')
    .pipe(stylus())
    .pipe(gulp.dest('site/css/'));
});