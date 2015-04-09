var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var User = require('../models/user');
var userForm = User.createForm();

router.get('/', isLoggedIn, function(req, res, next) {
  User.find(function(err, users) {
    if (err) return next(err);
    res.render('users/index.html', {
      users: users
    });
  })
});

router.get('/new', isLoggedIn, function(req, res, next) {
  res.render('users/new.html', {
    form: userForm.toHTML()
  });
});

router.post('/new', isLoggedIn, function(req, res, next) {
  req.body.createdAt = req.body.updatedAt = new Date();
  User.create(req.body, function(err, user) {
    console.log(err)
    if (err) return next(err);
    res.redirect('/users');
  });
});

router.get('/:id', isLoggedIn, function(req, res, next) {
  User.findById(req.params.id)
  .exec(function(err, user) {
    if (err) return next(err);
    res.render('users/show.html', {
      user: user
    })
  })
});

module.exports = router;