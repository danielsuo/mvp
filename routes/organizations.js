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

var Floor = require('../models/floor');
var Demising = require('../models/demising');
var Suite = require('../models/suite');
var Testfit = require('../models/testfit');

router.get('/:id', isLoggedIn, function(req, res, next) {
  Organization.findById(req.params.id)
    .lean()
    .populate('buildings')
    .exec(function(err, organization) {
      Building.populate(organization.buildings, {
        path: 'floors'
      }, function(err, buildings) {
        for (var i = 0; i < buildings.length; i++) {
          Floor.populate(buildings[i].floors, {
            path: 'demisings'
          }, function(err, floors) {
            for (var j = 0; j < floors.length; j++) {
              Demising.populate(floors[j].demisings, {
                path: 'suites'
              }, function(err, demisings) {
                for (var k = 0; k < demisings.length; k++) {
                  Suite.populate(demisings[k].suites, {
                    path: 'testfits'
                  }, function(err, suites) {
                    if (err) return next(err);
                    res.render('organizations/show.html', {
                      organization: organization
                    });
                  })
                }
              })
            }
          })
        }
      })
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