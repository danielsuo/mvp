var Furniture = require('./Furniture');

var blah = new Furniture();

blah.size(100, 100)
blah.attr({
  fill: '#f06'
})

module.exports = function(element) {
  var parent = element.parent;
  parent.add(blah);
};