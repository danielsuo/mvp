var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var Testfit = require('../models/testfit');

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
  Testfit.findById(req.params.id)
    .exec(function(err, testfit) {
      console.log(testfit)
      if (err) return next(err);
      res.render('testfits/show.html', {
        testfit: testfit
      })
    })
});

// router.get('/:id/floors/new', isLoggedIn, function(req, res, next) {
//   res.render('floors/new.html', {
//     form: floorForm.toHTML()
//   });
// });

// router.post('/:id/floors/new', isLoggedIn, function(req, res, next) {
//   req.body.building = mongoose.Types.ObjectId(req.params.id);
//   Floor.create(req.body, function(err, floor) {
//     if (err) return next(err);
//     res.redirect('/buildings/' + req.params.id + '/');
//   });
// });

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