var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var Floor = require('../models/floor');
var Demising = require('../models/demising');

var demisingForm = Demising.createForm();

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
  Floor.findById(req.params.id)
    .populate('demisings')
    .exec(function(err, floor) {
      if (err) return next(err);
      res.render('floors/show.html', {
        floor: floor
      })
    })
});

router.get('/:id/demisings/new', isLoggedIn, function(req, res, next) {
  res.render('demisings/new.html', {
    form: demisingForm.toHTML()
  });
});

router.post('/:id/demisings/new', isLoggedIn, function(req, res, next) {
  req.body.floor = mongoose.Types.ObjectId(req.params.id);
  req.body.createdAt = req.body.updatedAt = new Date();
  Demising.create(req.body, function(err, demising) {
    if (err) return next(err);
    res.redirect('/floors/' + req.params.id + '/');
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