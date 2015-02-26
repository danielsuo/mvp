var gulp = require('gulp');
var jsonminify = require('gulp-jsonminify');
var svgmin = require('gulp-svgmin');

gulp.task('data', function() {
  gulp.src('./assets/data/**/*.json')
    .pipe(jsonminify())
    .pipe(gulp.dest('site/data/'));

  gulp.src('./assets/data/**/*.svg')
    // .pipe(svgmin({
    //   plugins: [{
    //     convertShapeToPath: false
    //   }]
    // }))
    .pipe(gulp.dest('site/data'));
});