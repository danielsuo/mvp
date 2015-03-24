var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')

var demisingSchema = mongoose.Schema({
  number: String,
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

demisingSchema.statics.createForm = function() {
  return 1;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Demising', demisingSchema);