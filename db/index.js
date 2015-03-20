var mongoose = require('mongoose');
var db;

mongoose.connect(process.env.MONGOLAB_URI);
db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

module.exports = db;