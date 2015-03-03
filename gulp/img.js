var gulp = require('gulp');

gulp.task('img', function() {
  gulp.src('./assets/img/**/*')
    .pipe(gulp.dest('site/img/'));
});