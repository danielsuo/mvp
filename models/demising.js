var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var findOrCreate = require('mongoose-findorcreate')

var demisingSchema = mongoose.Schema({
  name: {
    type: String,
    forms: {
      all: {}
    }
  },
  createdAt: Date,
  updatedAt: Date,
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

demisingSchema.plugin(findOrCreate);

demisingSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Demising', demisingSchema);