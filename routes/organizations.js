var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var isLoggedIn = require('./util/isLoggedIn');

var Organization = require('../models/organization');
var Building = require('../models/building');
var User = require('../models/user');

var organizationForm = Organization.createForm();
var buildingForm = Building.createForm();
var userForm = User.createForm();

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
    res.redirect('/organizations/');
  });
});

router.get('/:id', isLoggedIn, function(req, res, next) {
  Organization.findById(req.params.id)
    .deepPopulate('buildings.floors.demisings.suites.testfits')
    .exec(function(err, organization) {
      res.render('organizations/show.html', {
        organization: organization
      });
    });
});

// Borrow 'new' template for now
router.get('/:id/edit', isLoggedIn, function(req, res, next) {
  res.render('organizations/new.html', {
    form: organizationForm.toHTML()
  });
});

router.post('/:id/edit', isLoggedIn, function(req, res, next) {
  Organization.findById(req.params.id, function(err, organization) {
    if (err) return next(err);
    organization.name = req.body.name;
    organization.address = req.body.address;
    organization.owner = req.body.owner;

    organization.save(function(err) {
      if (err) return next(err);
      res.redirect('/organizations/' + req.params.id + '/');
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

router.get('/:id/users/new', isLoggedIn, function(req, res, next) {
  res.render('users/new.html', {
    form: userForm.toHTML()
  });
});

router.post('/:id/users/new', isLoggedIn, function(req, res, next) {
  User.findOne({
    email: req.body.email
  }, function(err, user) {
    if (err) return err;
    if (!user) {
      var newUser = new User();
      newUser.email = req.body.email;
      newUser.password = newUser.generateHash(req.body.password);
      newUser.role = newUser.role;
      newUser.organizations = [mongoose.Types.ObjectId(req.params.id)];
      newUser.name = req.body.name;

      newUser.save(function(err) {
        if (err) throw err;
        console.log(newUser);
        res.redirect('/organizations/' + req.params.id + '/');
      });
    }
  })
  // console.log(req.body)
  // req.body.organizations = ;
  //   console.log(req.body)
  //   console.log(User)
  // req.body.password = User.generateHash(req.body.password);
  //   console.log(req.body)
  // console.log('hello')
  // User.create(req.body, function(err, user) {
  //   console.log(err)
  //   if (err) return next(err);
  //   console.log(req.params.id)
  //   res.redirect('/organizations/' + req.params.id + '/');
  // });
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