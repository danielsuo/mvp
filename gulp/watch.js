var gulp = require('gulp');
var reload = require('browser-sync').reload

gulp.task('watch', ['browserSync'], function() {
  gulp.watch('*.html', ['html', reload]);
  gulp.watch('./assets/css/**/*', ['css', reload]);
  gulp.watch('./assets/svg/**/*.svg', ['svg', reload]);
  gulp.watch('./assets/img/**/*.jpg', ['img', reload]);
  gulp.watch('./assets/pdf/**/*.pdf', ['pdf', reload]);
  gulp.watch('./assets/data/**/*', ['data', reload]);

  gulp.watch(['./assets/js/**/*.js'], ['browserify', reload]);
});