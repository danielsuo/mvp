var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')
var forms = require('forms-mongoose');
var deepPopulate = require('mongoose-deep-populate');

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
  buildings: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Building'
  }]
});

organizationSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

organizationSchema.plugin(deepPopulate);

// create the model for users and expose it to our app
module.exports = mongoose.model('Organization', organizationSchema);