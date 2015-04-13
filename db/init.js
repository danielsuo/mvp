var walk = require('walk');
var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose')
var _ = require('lodash');

var db = require('./');

var models = {};
var modelNames = ['organization', 'building', 'floor', 'demising', 'suite'];

modelNames.map(function(model) {
  models[model] = require('../models/' + model);
});

var User = require('../models/user');

var walker = walk.walk("./public/data", {
  followLinks: false
});

var exists = function(config, parent, modelName) {
  var pluralName = modelName + 's';

  // Check to make sure our current project described by config can be found in
  // the parent object (equal name or number field)
  for (var i = 0; i < parent[pluralName].length; i++) {
    if ((parent[pluralName][i].name && parent[pluralName][i].name === config[modelName].name) ||
      (parent[pluralName][i].number && parent[pluralName][i].number === String(config[modelName].number)))
      return i;
  }

  return -1;
};

var findOrCreate = function(config, parent, modelName) {
  var pluralName = modelName + 's';

  // Get index of current config object in parent list of children
  var index = exists(config, parent, modelName);

  // Get model's height in the model tree
  var height = modelNames.indexOf(modelName);

  // Get parent model name
  var parentName = modelNames[height - 1];
  if (modelName == 'building') parentName += 's';

  // Get child model name
  var childName = height < modelNames.length - 1 && height > -1 ?
    modelNames[height + 1] : false;

  if (index === -1) { // If doesn't exist, create
    config[modelName].createdAt = config[modelName].updatedAt = new Date();

    var parentId = mongoose.Types.ObjectId(parent._id);
    config[modelName][parentName] = modelName == 'building' ? [parentId] : parentId;

    if (modelName === 'suite') {
      config[modelName].config = _.clone(config, true);
    }

    models[modelName].create(config[modelName], function(err, object) {
      if (childName) findOrCreate(config, object, childName);
      // if (modelName === 'suite') {
      //   findOrCreateTestfits(config, object);
      // }
    });
  } else { // Else, find
    if (childName) findOrCreate(config, parent[pluralName][index], childName);

    // Save config data
    if (modelName === 'suite') {
      parent[pluralName][index].config = config;
      parent[pluralName][index].save();
      // findOrCreateTestfits(config, parent[pluralName][index]);
    }
  }
};

var Testfit = require('../models/testfit');

var findOrCreateTestfits = function(config, suite) {
  for (var i = 0; i < config.layouts.length; i++) {
    var testfitExists = false;
    for (var j = 0; j < suite.testfits.length; j++) {
      if (suite.testfits[j].name === config.layouts[i].name) testfitExists = true;
    }
    if (!testfitExists) {
      var testfit = new Testfit();
      testfit.suite = mongoose.Types.ObjectId(suite._id);
      testfit.name = config.layouts[i].name;
      testfit.layout = config.layouts[i].state;
      testfit.createdAt = testfit.updatedAt = new Date();
      testfit.save();
    }
  }
}

var findOrCreateUser = function(config, organization) {
  User.findOne({
    email: config.user.email
  }, function(err, user) {
    if (err) return err;
    if (!user) {
      var newUser = new User();
      newUser.email = config.user.email;
      newUser.password = '$2a$08$QcILLHOek8YRRmE8SzgzDO5dSeWpWPfSoO2gmmXxAl4YVWc2NZoZK';
      newUser.role = newUser.role;
      newUser.organizations = [mongoose.Types.ObjectId(organization._id)];
      newUser.name = config.user.name;
      newUser.createdAt = newUser.updatedAt = new Date();

      newUser.save();
    }
  });
}

walker.on("file", function fileHandler(root, fileStat, next) {
  fs.readFile(path.resolve(root, fileStat.name), function(buffer) {
    if (fileStat.name === 'config.json') {
      var configPath = root + '/config.json';
      if (fs.existsSync(configPath)) {
        fs.readFile(configPath, 'utf8', function(err, data) {
          var config = JSON.parse(data);
          if (config.version) {
            // Assume one organization for now
            models['organization'].findOne({
              name: config.organizations[0].name
            }).deepPopulate('buildings.floors.demisings.suites.testfits')
              .exec(function(err, organization) {
                if (organization) {
                  findOrCreate(config, organization, 'building');
                  findOrCreateUser(config, organization);
                } else {
                  models['organization'].create(config.organizations[0],
                    function(err, organization) {
                      findOrCreate(config, organization, 'building');
                      findOrCreateUser(config, organization);
                    })
                }
              });
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
  console.log("Database updated!");
};