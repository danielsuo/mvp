// Create admin user
var User = require('../models/user');

User.findOne({
  email: process.env.ADMIN_EMAIL
}, function(err, user) {
  if (err) return err;
  if (!user) {
    var newUser = new User();
    newUser.email = process.env.ADMIN_EMAIL;
    newUser.password = newUser.generateHash(process.env.ADMIN_PASSWORD);
    newUser.role = 'admin';

    newUser.save(function(err) {
      if (err) throw err;
    });
  }
  return;
});