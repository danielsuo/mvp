var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var deepPopulate = require('mongoose-deep-populate');
var findOrCreate = require('mongoose-findorcreate')

var suiteSchema = mongoose.Schema({
  number: {
    type: String,
    forms: {
      all: {}
    }
  },
  name: {
    type: String,
    forms: {
      all: {}
    }
  },
  directory: {
    type: String,
    forms: {
      all: {}
    }
  },
  area: {
    type: Number,
    forms: {
      all: {}
    }
  },
  config: {},
  createdAt: Date,
  updatedAt: Date,
  demising: {
    type: mongoose.Schema.ObjectId,
    ref: 'Demising',
    childPath: 'suites'
  },
  testfits: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Testfit'
  }]
});

suiteSchema.plugin(relationship, {
  relationshipPathName: 'demising'
});

suiteSchema.plugin(deepPopulate);
suiteSchema.plugin(findOrCreate);

suiteSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('Suite', suiteSchema);