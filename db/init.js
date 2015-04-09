var walk = require('walk');
var fs = require('fs');
var path = require('path');

var db = require('./');

var models = ['user', 'organization', 'building', 'floor', 'demising', 'suite', 'testfit']
  .map(function(model) {
    return require('../models/' + model);
  });

var walker = walk.walk("./public/data", {
  followLinks: false
});

walker.on("file", function fileHandler(root, fileStat, next) {
  fs.readFile(path.resolve(root, fileStat.name), function(buffer) {
    if (fileStat.name === 'config.json') {
      var configPath = root + '/config.json';
      if (fs.existsSync(configPath)) {
        fs.readFile(configPath, 'utf8', function(err, data) {
          var config = JSON.parse(data);
          if (config.version) {
            console.log(config)
          }
        })
      }
    }
    next();
  });
});

walker.on("errors", errorsHandler); // plural
walker.on("end", endHandler);


function errorsHandler(root, nodeStatsArray, next) {
  nodeStatsArray.forEach(function(n) {
    console.error("[ERROR] " + n.name)
    console.error(n.error.message || (n.error.code + ": " + n.error.path));
  });
  next();
};

function endHandler() {
  console.log("all done");
};

// var fs = require('fs');

// // load the env variables
// var envPath = __dirname + '/../config/env.json';
// if (fs.existsSync(envPath)) {
//   var envConfig = require(envPath);
//   Object.keys(envConfig).forEach(function(key) {
//     process.env[key] = envConfig[key];
//   });
// }