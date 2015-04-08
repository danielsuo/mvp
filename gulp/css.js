var gulp = require('gulp');
var nib = require('nib');
var stylus = require('gulp-stylus');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('css', function() {
	gulp.src('./assets/css/**/*.css')
		.pipe(gulp.dest('site/css/'));

  gulp.src('./assets/css/**/*.styl')
    .pipe(stylus({ use: nib() }))
    .pipe(gulp.dest('site/css/'));
});