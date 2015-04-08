module.exports = function(points, coordNum) {
  var center = points.reduce(function(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }, {
    x: 0,
    y: 0
  });

  center = {
    x: center.x / points.length,
    y: center.y / points.length
  };

  points.sort(function(a, b) {
    if (a.x - center.x >= 0 && b.x - center.x < 0) {
      return 1;
    }
    if (a.x - center.x < 0 && b.x - center.x >= 0) {
      return -1;
    }
    if (a.x - center.x == 0 && b.x - center.x == 0) {
      if (a.y - center.y >= 0 || b.y - center.y >= 0) {
        return a.y > b.y ? 1 : -1;
      }
      return b.y > a.y ? 1 : -1;
    }

    // compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
    if (det < 0) {
      return 1;
    }
    if (det > 0) {
      return -1;
    }

    // points a and b are on the same line from the center
    // check which point is closer to the center
    var d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
    var d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
    return d1 > d2 ? 1 : -1;
  });

  for (var i = 0; i < points.length; i++) {
    var indices = [0, 1, 2, 3].map(function(x) {
      return (i + x) % points.length;
    });

    var pts = indices.map(function(x) {
      return points[x];
    });

    if ((pts[1].x == pts[2].x || pts[1].y == pts[2].y) && // 1st and 2nd points are on horizontal or vertical line
      (pts[0].x == pts[2].x || pts[0].y == pts[2].y) && // 0th and 2nd points are on horizontal or vertical line
      (pts[1].x == pts[3].x || pts[1].y == pts[3].y) // 1st and 3rd points are on horizontal or vertical line
    ) {
      points[indices[1]] = points.splice(indices[2], 1, points[indices[1]])[0];
    }

  }
}