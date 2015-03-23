var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')

var buildingSchema = mongoose.Schema({
  name: String,
  address: String,
  organization: {
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
    childPath: 'buildings'
  },
  floors: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Floor'
  }]
});

buildingSchema.plugin(relationship, {
  relationshipPathName: 'organization'
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Building', buildingSchema);