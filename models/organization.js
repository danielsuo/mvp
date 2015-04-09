var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var deepPopulate = require('mongoose-deep-populate');
var findOrCreate = require('mongoose-findorcreate')

var organizationSchema = mongoose.Schema({
  name: {
    type: String,
    forms: {
      all: {}
    }
  },
  owner: {
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
  buildings: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Building'
  }],
  users: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
});

organizationSchema.plugin(deepPopulate);
organizationSchema.plugin(findOrCreate);

organizationSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Organization', organizationSchema);