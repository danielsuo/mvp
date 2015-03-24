var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')
var forms = require('forms-mongoose');

var demisingSchema = mongoose.Schema({
  number: {
    type: String,
    forms: {
      all: {}
    }
  },
  floor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Floor',
    childPath: 'demisings'
  },
  suites: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Suite'
  }]
});

demisingSchema.plugin(relationship, {
  relationshipPathName: 'floor'
});

demisingSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Demising', demisingSchema);