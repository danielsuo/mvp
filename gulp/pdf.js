var gulp = require('gulp');

gulp.task('pdf', function() {
	gulp.src('./assets/pdf/**/*.pdf')
		.pipe(gulp.dest('site/pdf/'));
});