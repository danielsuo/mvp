var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')

var organizationSchema = mongoose.Schema({
  name: String,
  owner: String,
  address: String,
  buildings: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Building'
  }]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Organization', organizationSchema);