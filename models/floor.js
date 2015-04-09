var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var findOrCreate = require('mongoose-findorcreate')

var floorSchema = mongoose.Schema({
  number: {
    type: String,
    forms: {
      all: {}
    }
  },
  createdAt: Date,
  updatedAt: Date,
  building: {
    type: mongoose.Schema.ObjectId,
    ref: 'Building',
    childPath: 'floors'
  },
  demisings: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Demising'
  }]
});

floorSchema.plugin(relationship, {
  relationshipPathName: 'building'
});

floorSchema.plugin(findOrCreate);

floorSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Floor', floorSchema);