var gulp = require('gulp');
var watch = require('gulp-watch');
var config = require('../config').client;

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var minimist = require('minimist');
var options = minimist(process.argv.slice(2));

var tasks = ['js', 'css', 'data'];

gulp.task('client', tasks, function() {
  if (!options.build) {
    browserSync({
      proxy: "http://localhost:3000",
      port: 5000,
      notify: true
    });

    watch(config.reload)
      .pipe(reload({
        stream: true
      }));
  }
});

gulp.task('data', function() {
  config.data.dest = options.build ? './public/data/' : config.data.dest;
  var src = options.build ? gulp.src(config.data.src) :
    watch(config.data.src, {
      base: config.data.base
    });

  src
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest(config.data.dest));
});

var nib = require('nib');
var stylus = require('gulp-stylus');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('css', function() {
  config.css.dest = options.build ? './public/css/' : config.css.dest;
  var src = options.build ? gulp.src(config.css.src) :
    watch(config.css.src, {
      base: config.css.base
    });

  src
    .pipe(stylus({
      use: nib()
    }))
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest(config.css.dest));
});

var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var bundleLogger = require('../util/bundleLogger');
var handleErrors = require('../util/handleErrors');

gulp.task('js', function(callback) {
  var bundleQueue = config.js.bundleConfigs.length;

  var browserifyThis = function(bundleConfig) {

    var bundler = browserify({
      // Required watchify args
      cache: {},
      packageCache: {},
      fullPaths: false,
      // Specify the entry point of your app
      entries: bundleConfig.entries,
      // Add file extentions to make optional in your requires
      extensions: config.js.extensions,
      // Enable source maps!
      debug: config.js.debug
    });

    var bundle = function() {
      // Log when bundling starts
      bundleLogger.start(bundleConfig.outputName);

      return bundler
        .bundle()
        // Report compile errors
        .on('error', handleErrors)
        // Use vinyl-source-stream to make the
        // stream gulp compatible. Specifiy the
        // desired output filename here.
        .pipe(source(bundleConfig.outputName))
        // Specify the output destination
        .pipe(gulp.dest(bundleConfig.dest))
        .on('end', reportFinished);
    };

    if (!options.build) {
      // Wrap with watchify and rebundle on changes
      bundler = watchify(bundler, {
        glob: config.js.watch
      });
      // Rebundle on update
      bundler.on('update', bundle);
    }

    var reportFinished = function() {
      // Log when bundling completes
      bundleLogger.end(bundleConfig.outputName);

      if (bundleQueue) {
        bundleQueue--;
        if (bundleQueue === 0) {
          // If queue is empty, tell gulp the task is complete.
          // https://github.com/gulpjs/gulp/blob/master/docs/API.md#accept-a-callback
          callback();
        }
      }
    };

    return bundle();
  };

  // Start bundling with Browserify for each bundleConfig specified
  config.js.bundleConfigs.forEach(browserifyThis);
});