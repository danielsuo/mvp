var gulp = require('gulp');

gulp.task('svg', function() {
	gulp.src('./assets/svg/**/*.svg')
		.pipe(gulp.dest('site/svg/'));
});