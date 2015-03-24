var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var forms = require('forms-mongoose');

var userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    forms: {
      all:{
        type: 'email'
      }
    }
  },
  password: String,
  role: String,
  name: {
    type: String,
    forms: {
      all: {}
    }
  }
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.statics.createForm = function(extra) {
  return forms.create(this, extra);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);