var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')
var forms = require('forms-mongoose');

var suiteSchema = mongoose.Schema({
  number: {
    type: String,
    forms: {
      all: {}
    }
  },
  demising: {
    type: mongoose.Schema.ObjectId,
    ref: 'Demising',
    childPath: 'suites'
  },
  testfits: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Testfit'
  }]
});

suiteSchema.plugin(relationship, {
  relationshipPathName: 'demising'
});

suiteSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Suite', suiteSchema);