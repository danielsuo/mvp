var SVG = require('./svg');

var Furniture = function() {
  this.id = Furniture.id;

  Furniture.id++;

  return new SVG.Rect();
};

Furniture.id = 0;

module.exports = Furniture;