var isLoggedIn = require('./util/isLoggedIn');
var isAdmin = require('./util/isAdmin');

var Organization = require('../models/organization');

module.exports = function(app, user, passport) {

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get('/', function(req, res) {
    res.render('index.html'); // load the index.html file
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
          res.render('organizations/show.html', {
            organization: organization
          });
        });
    }
  });

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

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // =====================================
  // Routes ==============================
  // =====================================
  app.get('/test', function(req, res) {
    res.render('test.html', {

    });
  });

  app.get('/testfits/5522b67c716c341100ee015c', function(req, res) {
    res.render('test.html', {});
  });

  app.use('/users', isAdmin, require('./users'));
  app.use('/organizations', isAdmin, require('./organizations'));
  app.use('/buildings', isAdmin, require('./buildings'));
  app.use('/floors', isAdmin, require('./floors'));
  app.use('/demisings', isAdmin, require('./demisings'));
  app.use('/suites', isAdmin, require('./suites'));
  app.use('/testfits', isAdmin, require('./testfits'));

  // var models = ['organization', 'building', 'floor', 'demising', 'suite'];
  // for (var i = 0; i < models.length; i++) {
  //   app.use('/' + require('pluralize')(models[i]), require('./util/models')(models[i]));
  // }
};