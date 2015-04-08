var Hammer = require('hammerjs');

var Button = function(id) {
  this.id = id;
  this.node = document.getElementById(id);
  this.hammer = new Hammer(this.node);
};

module.exports = Button;