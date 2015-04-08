require('../svg/path');

module.exports = {
  fromPoints: function(path, points, ccw) {

    require('../util/sortPoints')(points);

    path.M(points[0].x, points[0].y);

    if (!ccw) points.reverse();

    for (var i = 1; i < points.length; i++) {
      path.L(points[i].x, points[i].y);
    }

    return path;
  },

  fromRect: function(path, x, y, width, height, ccw) {
    height = height || width;

    return path.M({
      x: x,
      y: y
    }).L({
      x: x + (ccw ? 0 : width),
      y: y + (ccw ? height : 0)
    }).L({
      x: x + width,
      y: y + height
    }).L({
      x: x + (ccw ? width : 0),
      y: y + (ccw ? 0 : height)
    }).L({
      x: x,
      y: y
    })
  }
};