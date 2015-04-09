var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var Suite = require('../models/suite');
var Testfit = require('../models/testfit');

var testfitForm = Testfit.createForm();

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
  Suite.findById(req.params.id)
    .populate('testfits')
    .exec(function(err, suite) {
      if (err) return next(err);
      res.render('suites/show.html', {
        suite: suite
      })
    })
});

router.get('/:id/testfits/new', isLoggedIn, function(req, res, next) {
  res.render('testfits/new.html', {
    form: testfitForm.toHTML()
  });
});

router.post('/:id/testfits/new', isLoggedIn, function(req, res, next) {
  req.body.suite = mongoose.Types.ObjectId(req.params.id);
  req.body.createdAt = req.body.updatedAt = new Date();
  Testfit.create(req.body, function(err, testfit) {
    if (err) return next(err);
    res.redirect('/suites/' + req.params.id + '/');
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