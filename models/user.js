var mongoose = require('mongoose');
var relationship = require('mongoose-relationship');
var forms = require('forms-mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    forms: {
      all: {
        type: 'email'
      }
    }
  },
  password: {
    type: String,
    forms: {
      all: {}
    }
  },
  role: {
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
  organizations: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Organization',
    childPath: 'users'
  }]
});

userSchema.plugin(relationship, {
  relationshipPathName: 'organizations'
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

// var User = mongoose.model('User', userSchema);

// userSchema.statics.createUser = function(form, callback) {
//   User.findOne({
//     email: form.email
//   }, function(err, user) {
//     if (err) return err;
//     if (!user) {
//       var newUser = new User();
//       newUser.email = form.email
//       newUser.password = newUser.generateHash(form.password);
//       newUser.role = form.role;

//       newUser.save(function(err) {
//         callback(err, newUser);
//       });
//     }
//     return;
//   });
// };

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);;