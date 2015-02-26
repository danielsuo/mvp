var radio = require('radio');
var SVG = require('../svg');
require('../svg/path');

var sortPoints = require('../util/sortPoints');

var Cells = {};

Cells.attr = {
  stroke: '#0f0',
  'fill-opacity': 0
};

Cells.paths = [];

Cells.load = function(svg, url) {
  return SVG.load(svg, url).then(function(svg) {
    Cells.svg = svg;
    Cells.state = [];
    Cells.coord = svg.children()[0].children()[0].children();

    for (var i in Cells.coord) {
      var cell = Cells.coord[i];
      var lines = cell.children();

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

      Cells.coord[i] = points;
      Cells.state.push(0);
    }

    return Cells;
  });
};

Cells.draw = function(reset) {
  if (reset) Cells.paths = [];

  for (var i in Cells.coord) {
    var coord = Cells.coord[i];
    var path = Cells.svg.path();

    if (reset) {
      path.attr(Cells.attr);
      sortPoints(coord);
    }

    for (var j in coord) {
      if (j == 0) {
        path.M(coord[j].x, coord[j].y);
      } else {
        path.L(coord[j].x, coord[j].y);
      }
    }

    path.Z();
    Cells.paths.push(path);

    (function(x) {
      path.click(function(event) {
        radio('cell-clicked').broadcast(x);
      })
    })(i);
  }
};

Cells.reset = function() {
  Cells.draw(true);
};

module.exports = Cells;