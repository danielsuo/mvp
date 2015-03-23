var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')

var suiteSchema = mongoose.Schema({
  number: String,
  demising: {
    type: mongoose.Schema.ObjectId,
    ref: 'Demising',
    childPath: 'suites'
  }
});

suiteSchema.plugin(relationship, {
  relationshipPathName: 'demising'
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Suite', suiteSchema);