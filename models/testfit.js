var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var findOrCreate = require('mongoose-findorcreate')

var testfitSchema = mongoose.Schema({
  name: {
    type: String,
    forms: {
      all: {}
    }
  },
  createdAt: Date,
  updatedAt: Date,
  layout: {},
  suite: {
    type: mongoose.Schema.ObjectId,
    ref: 'Suite',
    childPath: 'testfits'
  }
});

testfitSchema.plugin(relationship, {
  relationshipPathName: 'suite'
});

testfitSchema.plugin(findOrCreate);

testfitSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Testfit', testfitSchema);