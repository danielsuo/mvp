var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var Organization = require('../models/organization');
var Building = require('../models/building');

var organizationForm = Organization.createForm();
var buildingForm = Building.createForm();

router.get('/', isLoggedIn, function(req, res, next) {
  Organization.find(function(err, organizations) {
    if (err) return next(err);
    res.render('organizations/index.html', {
      organizations: organizations
    });
  })
});

router.get('/list', isLoggedIn, function(req, res, next) {
  Organization.find(function(err, organizations) {
    if (err) return next(err);
    res.json(organizations)
  })
});

router.get('/new', isLoggedIn, function(req, res, next) {
  res.render('organizations/new.html', {
    form: organizationForm.toHTML()
  });
});

router.post('/new', isLoggedIn, function(req, res, next) {
  Organization.create(req.body, function(err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

var types = ['buildings', 'floors', 'demisings', 'suites', 'testfits'];

var deep = function(err, modelNames, parent, cb) {
  parent = parent.constructor === Array ? parent : [parent];

  var currentModelName = modelNames.shift();
  var currentModel = require('../models/' + currentModelName.slice(0, -1));

  if (parent.length > 0 && modelNames[0]) {
    for (var i = 0; i < parent.length; i++) {
      currentModel.populate(parent[i][currentModelName], {
        path: modelNames[0]
      }, function(err, currents) {
        deep(err, modelNames, currents, cb);
      })
    }
  } else {
    cb();
  }
}

router.get('/:id', isLoggedIn, function(req, res, next) {
  Organization.findById(req.params.id)
    .lean()
    .populate('buildings')
    .exec(function(err, organization) {
      deep(err, types.slice(0), organization, function() {
        res.render('organizations/show.html', {
          organization: organization
        });
      });
    });
});

router.get('/:id/buildings/new', isLoggedIn, function(req, res, next) {
  res.render('buildings/new.html', {
    form: buildingForm.toHTML()
  });
});

router.post('/:id/buildings/new', isLoggedIn, function(req, res, next) {
  req.body.organizations = [mongoose.Types.ObjectId(req.params.id)];
  Building.create(req.body, function(err, building) {
    if (err) return next(err);
    res.redirect('/organizations/' + req.params.id + '/');
  });
});

router.put('/:id', isLoggedIn, function(req, res, next) {
  Organization.findByIdAndUpdate(req.params.id, req.body, function(err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

router.delete('/:id', isLoggedIn, function(req, res, next) {
  Organization.findByIdAndRemove(req.params.id, req.body, function(err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

module.exports = router;