var path = require('path');

var isLoggedIn = require('./util/isLoggedIn');
var isAdmin = require('./util/isAdmin');

var Organization = require('../models/organization');
var Suite = require('../models/suite');
var User = require('../models/user');

module.exports = function(app, user, passport) {

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get('/', function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/home');
    } else {
      res.render('index.html'); // load the index.html file
    }
  });

  // =====================================
  // LOGIN ===============================
  // =====================================
  // show the login form
  app.get('/login', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login.html', {
      message: req.flash('loginMessage')
    });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/home', // redirect to user's organization page
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  app.get('/home', isLoggedIn, function(req, res) {
    if (req.user.role === 'admin') {
      res.render('admin.html');
    } else {
      Organization.findById(req.user.organizations[0])
        .deepPopulate('buildings.floors.demisings.suites.testfits')
        .exec(function(err, organization) {
          res.render('home.html', {
            organization: organization
          });
        });
    }
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/test', function(req, res) {
    res.render('app.html', {

    });
  });

  app.get('/app/:id', isLoggedIn, function(req, res) {
    Suite.findById(req.params.id)
      .deepPopulate('demising.floor.building.organizations.users')
      .exec(function(err, suite) {
        var inOrganization = false;
        var organizations = suite.demising.floor.building.organizations;
        for (var i = 0; i < organizations.length; i++) {
          var users = organizations[i].users;
          for (var j = 0; j < users.length; j++) {
            if (users[j].email === req.user.email) {
              inOrganization = true;
            }
          }
        }
        if (inOrganization) {
          res.render('app.html', {

          });
        } else {
          res.redirect('/');
        }
      })
  });

  // TODO: refactor; shouldn't get suite multiple times, not check whether user
  // is in org etc. Generally horrible things.

  // TODO: add in validation; these routes are really insecure, generally speaking

  // New test fit
  app.post('/app/:id/new', isLoggedIn, function(req, res) {

  });

  // View test fit
  app.get('/app/:id/testfit/:tid', isLoggedIn, function(req, res) {

  });

  // Update / save test fit
  app.put('/app/:id/testfit/:tid', isLoggedIn, function(req, res) {

  });

  // Delete a test fit
  app.delete('/app/:id/testfit/:tid', isLoggedIn, function(req, res) {

  });

  app.get('/config/:id', isLoggedIn, function(req, res) {
    Suite.findById(req.params.id)
      .exec(function(err, suite) {
        res.sendFile(path.join(__dirname, '../public', suite.directory, 'config.json'));
      });
  });

  app.use('/users', isAdmin, require('./users'));
  app.use('/organizations', isAdmin, require('./organizations'));
  app.use('/buildings', isAdmin, require('./buildings'));
  app.use('/floors', isAdmin, require('./floors'));
  app.use('/demisings', isAdmin, require('./demisings'));
  app.use('/suites', isAdmin, require('./suites'));
  app.use('/testfits', isAdmin, require('./testfits'));
};


// =====================================
// SIGNUP ==============================
// =====================================
// show the signup form
// app.get('/signup', function(req, res) {

//   // render the page and pass in any flash data if it exists
//   res.render('signup.html', {
//     message: req.flash('signupMessage')
//   });
// });

// process the signup form
// app.post('/signup', passport.authenticate('local-signup', {
//   successRedirect: '/profile', // redirect to the secure profile section
//   failureRedirect: '/signup', // redirect back to the signup page if there is an error
//   failureFlash: true // allow flash messages
// }));

// =====================================
// PROFILE  ============================
// =====================================
// we will want this protected so you have to be logged in to visit
// we will use route middleware to verify this (the isLoggedIn function)
// app.get('/profile', isLoggedIn, function(req, res) {
//   res.render('profile.html', {
//     user: req.user // get the user out of session and pass to template
//   });
// });

// =====================================
// PROTOFIT ============================
// =====================================
// app.get('/app', isLoggedIn, function(req, res) {
//   res.render('app.html', {
//     user: req.user
//   });
// });