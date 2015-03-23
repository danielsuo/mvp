var express = require('express');
var router = express.Router();

var isLoggedIn = require('./util/isLoggedIn');
var Organization = require('../models/organization');

/* GET users listing. */
router.get('/', isLoggedIn, function(req, res, next) {
  Organization.find(function(err, organizations) {
    if (err) return next(err);
    res.json(organizations)
  })
});

router.post('/', isLoggedIn, function(req, res, next) {
  Organization.create(req.body, function(err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

router.get('/:id', isLoggedIn, function(req, res, next) {
  Organization.findById(req.params.id, function(err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

router.put('/:id', isLoggedIn, function(req, res, next) {
  Organization.findByIdAndUpdate(req.params.id, req.body, function (err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

router.delete('/:id', isLoggedIn, function(req, res, next) {
  Organization.findByIdAndRemove(req.params.id, req.body, function (err, organization) {
    if (err) return next(err);
    res.json(organization);
  });
});

module.exports = router;