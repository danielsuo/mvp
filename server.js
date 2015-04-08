var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname + '/site')).listen(8080);