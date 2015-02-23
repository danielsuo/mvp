var gulp = require('gulp');

gulp.task('img', function() {
  gulp.src('./assets/img/**/*.jpg')
    .pipe(gulp.dest('site/img/'));
});