var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');

var testfitSchema = mongoose.Schema({
  name: {
    type: String,
    forms: {
      all: {}
    }
  },
  createdAt: Date,
  updatedAt: Date,
  suite: {
    type: mongoose.Schema.ObjectId,
    ref: 'Suite',
    childPath: 'testfits'
  }
});

testfitSchema.plugin(relationship, {
  relationshipPathName: 'suite'
});

testfitSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Testfit', testfitSchema);