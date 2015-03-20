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
      }]
    },
    css: {
      base: src,
      src: [src + 'css/**/*'],
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