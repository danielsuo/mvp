var isLoggedIn = require('./util/isLoggedIn');

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
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.html', {
      message: req.flash('signupMessage')
    });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =====================================
  // PROFILE  ============================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.html', {
      user: req.user // get the user out of session and pass to template
    });
  });

  // =====================================
  // PROTOFIT ============================
  // =====================================
  app.get('/app', isLoggedIn, function(req, res) {
    res.render('app.html', {
      user: req.user
    });
  });

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
  app.use('/organizations', require('./organizations'));
  app.use('/buildings', require('./buildings'));
  app.use('/floors', require('./floors'));
  require('../models/demising');
  // var models = ['organization', 'building', 'floor', 'demising', 'suite'];
  // for (var i = 0; i < models.length; i++) {
  //   app.use('/' + require('pluralize')(models[i]), require('./util/models')(models[i]));
  // }
};