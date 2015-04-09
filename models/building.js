var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var findOrCreate = require('mongoose-findorcreate')

var buildingSchema = mongoose.Schema({
  name: {
    type: String,
    forms: {
      all: {}
    }
  },
  address: {
    type: String,
    forms: {
      all: {}
    }
  },
  createdAt: Date,
  updatedAt: Date,
  organizations: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
    childPath: 'buildings'
  }],
  floors: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Floor'
  }]
});

buildingSchema.plugin(relationship, {
  relationshipPathName: 'organizations'
});

buildingSchema.plugin(findOrCreate);

buildingSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Building', buildingSchema);