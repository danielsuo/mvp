module.exports = function(modelName) {
  var express = require('express');
  var router = express.Router();

  var isLoggedIn = require('./isLoggedIn');

  var Model = require('../../models/' + modelName);
  var pluralName = require('pluralize')(modelName);

  var form = Model.createForm();

  router.get('/', isLoggedIn, function(req, res, next) {
    Model.find(function(err, models) {
      if (err) return next(err);
      res.render(pluralName + '/index.html', {
        models: models
      });
    })
  });

  router.get('/list', isLoggedIn, function(req, res, next) {
    Model.find(function(err, models) {
      if (err) return next(err);
      res.json(models)
    })
  });

  router.get('/new', isLoggedIn, function(req, res, next) {
    res.render(pluralName + '/new.html', {
      form: form.toHTML()
    });
  });

  router.post('/new', isLoggedIn, function(req, res, next) {
    console.log('posted')
    Model.create(req.body, function(err, model) {
      if (err) return next(err);
      res.json(model);
    });
  });

  router.get('/:id', isLoggedIn, function(req, res, next) {
    if (modelName == 'organization') {
      Model.findById(req.params.id)
        .populate('buildings')
        .exec(function(err, model) {
          console.log(model)
          if (err) return next(err);
          res.render(pluralName + '/show.html', {
            model: model
          })
        })
    }
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