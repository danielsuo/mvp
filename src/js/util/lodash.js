var _ = require('lodash');

_.intersectionObjects = function(array) {
  var slice = Array.prototype.slice; // added this line as a utility
  var rest = slice.call(arguments, 1);
  return _.filter(_.uniq(array), function(item) {
    return _.every(rest, function(other) {
      //return _.indexOf(other, item) >= 0;
      return _.any(other, function(element) {
        return _.isEqual(element, item);
      });
    });
  });
};

var tolerance = 0.02;

_.intersectionPoints = function(array) {
  var slice = Array.prototype.slice; // added this line as a utility
  var rest = slice.call(arguments, 1);
  return _.filter(_.uniq(array), function(item) {
    return _.every(rest, function(other) {
      //return _.indexOf(other, item) >= 0;
      return _.any(other, function(element) {
        return Math.abs(element.x - item.x) < tolerance && Math.abs(element.y - item.y) < tolerance;
      });
    });
  });
};

module.exports = _;