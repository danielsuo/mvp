var gulp = require('gulp');

gulp.task('build', ['html', 'css', 'svg', 'img', 'pdf', 'data', 'browserify']);