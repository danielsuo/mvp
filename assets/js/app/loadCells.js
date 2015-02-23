var radio = require('radio');
require('../svg/path');

module.exports = function(svg, cells, url) {
  require('../svg/load')(svg, url, function() {
    cells.state = [];
    cells.data = svg.children()[0].children()[0].children();

    for (var i in cells.data) {
      var cell = cells.data[i];
      var lines = cell.children();
      var path = svg.path();

      path.attr({
        stroke: '#0f0',
        'fill-opacity': 0
      });

      var points = [];
      for (var j in lines) {
        var line = lines[j].children()[0];
        var p = {
          x: line.attr('x1'),
          y: line.attr('y1')
        };

        if (points.reduce(function(a, b) {
          return a && (b.x != p.x || b.y != p.y);
        }, true)) {
          points.push(p);
        }
      }

      require('../util/sortPoints')(points);

      for (var j in points) {
        if (j == 0) {
          path.M(points[j].x, points[j].y);
        } else {
          path.L(points[j].x, points[j].y);
        }
      }

      path.Z();

      cells.data[i] = points;
      cells.state.push(0);

      (function(x) {
        path.click(function(event) {
          radio('cell-clicked').broadcast(x, cells.data[x]);
        })
      })(i);
    }
  });
};