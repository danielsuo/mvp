module.exports = function(modelName) {
  var express = require('express');
  var router = express.Router();

  var isLoggedIn = require('./isLoggedIn');
  
  var Model = require('../../models/' + modelName);

  /* GET users listing. */
  router.get('/', isLoggedIn, function(req, res, next) {
    Model.find(function(err, models) {
      if (err) return next(err);
      res.json(models)
    })
  });

  router.post('/', isLoggedIn, function(req, res, next) {
    Model.create(req.body, function(err, model) {
      if (err) return next(err);
      res.json(model);
    });
  });

  router.get('/:id', isLoggedIn, function(req, res, next) {
    Model.findById(req.params.id, function(err, model) {
      if (err) return next(err);
      res.json(model);
    });
  });

  router.put('/:id', isLoggedIn, function(req, res, next) {
    Model.findByIdAndUpdate(req.params.id, req.body, function(err, model) {
      if (err) return next(err);
      res.json(model);
    });
  });

  router.delete('/:id', isLoggedIn, function(req, res, next) {
    Model.findByIdAndRemove(req.params.id, req.body, function(err, model) {
      if (err) return next(err);
      res.json(model);
    });
  });

  return router;
};