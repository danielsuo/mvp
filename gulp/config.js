var src = './src/';
var dest = './public/';

module.exports = {
  gulp: {
    watch: ['./gulpfile.js', './gulp/**/*.js']
  },
  client: {
    reload: ['./public/**/*', './views/**/*'],
    js: {
      // Enable source maps
      debug: true,
      watch: [src + 'js/**/*'],
      bundleConfigs: [{
        entries: src + 'js/main.js',
        dest: dest + '/js/',
        outputName: 'main.js'
      }, {
        entries: src + 'js/protofit.js',
        dest: dest + '/js/',
        outputName: 'protofit.js'
      }]
    },
    css: {
      base: src,
      src: [src + 'css/**/*'],
      dest: dest
    },
    data: {
      base: src,
      src: [src + 'data/**/*'],
      dest: dest
    }
  },
  server: {
    ignore: [
      'node_modules/**',
      'gulp/**',
      'src/**'
    ]
  }
};