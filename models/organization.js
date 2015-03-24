var mongoose = require('mongoose');
var relationship = require('mongoose-relationship')

var forms = require('forms-mongoose');

var organizationSchema = mongoose.Schema({
  name: {
    type: String,
    forms: {
      all: {}
    },
  },
  owner: {
    type: String,
    forms: {
      all: {}
    },
  },
  address: {
    type: String,
    forms: {
      all: {}
    },
  },
  buildings: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Building'
  }]
});

organizationSchema.statics.createForm = function(extra) {
  // var form = 
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Organization', organizationSchema);