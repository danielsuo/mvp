var gulp = require('gulp');

gulp.task('data', function() {
  gulp.src('./assets/data/**/*')
    .pipe(gulp.dest('site/data/'));
});