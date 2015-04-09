var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var Demising = require('../models/demising');
var Suite = require('../models/suite');

var suiteForm = Suite.createForm();

// router.get('/', isLoggedIn, function(req, res, next) {
//   Organization.find(function(err, organizations) {
//     if (err) return next(err);
//     res.render('organizations/index.html', {
//       organizations: organizations
//     });
//   })
// });

// router.get('/list', isLoggedIn, function(req, res, next) {
//   Organization.find(function(err, organizations) {
//     if (err) return next(err);
//     res.json(organizations)
//   })
// });

// router.get('/new', isLoggedIn, function(req, res, next) {
//   res.render('organizations/new.html', {
//     form: organizationForm.toHTML()
//   });
// });

// router.post('/new', isLoggedIn, function(req, res, next) {
//   Organization.create(req.body, function(err, organization) {
//     if (err) return next(err);
//     res.json(organization);
//   });
// });

router.get('/:id', isLoggedIn, function(req, res, next) {
  Demising.findById(req.params.id)
    .populate('suites')
    .exec(function(err, demising) {
      if (err) return next(err);
      res.render('demisings/show.html', {
        demising: demising
      })
    })
});

router.get('/:id/suites/new', isLoggedIn, function(req, res, next) {
  res.render('suites/new.html', {
    form: suiteForm.toHTML()
  });
});

router.post('/:id/suites/new', isLoggedIn, function(req, res, next) {
  req.body.demising = mongoose.Types.ObjectId(req.params.id);
  req.body.createdAt = req.body.updatedAt = new Date();
  Suite.create(req.body, function(err, suite) {
    if (err) return next(err);
    res.redirect('/demisings/' + req.params.id + '/');
  });
});

// router.put('/:id', isLoggedIn, function(req, res, next) {
//   Organization.findByIdAndUpdate(req.params.id, req.body, function(err, organization) {
//     if (err) return next(err);
//     res.json(organization);
//   });
// });

// router.delete('/:id', isLoggedIn, function(req, res, next) {
//   Organization.findByIdAndRemove(req.params.id, req.body, function(err, organization) {
//     if (err) return next(err);
//     res.json(organization);
//   });
// });

module.exports = router;