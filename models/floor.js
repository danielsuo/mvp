var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')

var floorSchema = mongoose.Schema({
  number: String,
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

// create the model for users and expose it to our app
module.exports = mongoose.model('Floor', floorSchema);