module.exports = function(x, len) {
  var hist = Array.apply(null, new Array(len + 1)).map(Number.prototype.valueOf, 0);

  for (var i in x) {
    hist[x[i]]++;
  }

  return hist;
};