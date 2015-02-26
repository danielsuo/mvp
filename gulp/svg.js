var gulp = require('gulp');
var svgmin = require('gulp-svgmin');

gulp.task('svg', function() {
  gulp.src('./assets/svg/**/*.svg')
    .pipe(svgmin())
    .pipe(gulp.dest('site/svg/'));
});