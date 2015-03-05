var radio = require('radio');
var SVG = require('../svg');
require('../svg/path');

var sortPoints = require('../util/sortPoints');
var isMobile = require('../util/mobile').any;

var Cells = {};

Cells.attr = {
  stroke: '#0f0',
};

Cells.paths = [];

Cells.mousedown = false;

Cells.load = function(svg, url) {
  return SVG.load(svg, url).then(function(svg) {
    svg.node.setAttribute('class', 'cells');
    Cells.svg = svg;
    Cells.state = [];
    Cells.coord = svg.children()[0].children();

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
        var p = {
          x: line.attr('x2'),
          y: line.attr('y2')
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

Cells.draw = function(opts) {
  if (opts.reset) {
    for (var i in Cells.paths) {
      Cells.paths[i].remove();
    }
    Cells.paths = [];
  }

  for (var i in Cells.coord) {
    var coord = Cells.coord[i];
    var path = Cells.svg.path();

    if (opts.reset) {
      path.attr(Cells.attr);
      sortPoints(coord);

      // console.log(i, coord.length, coord.reduce(function(x, y) {return x + ', ' + y.x + ' ' + y.y}, ''))
      // for (var j = coord.length - 1; j >= 0; j--) {
      //   var currIndex = j;
      //   var prevIndex = j - 1 < 0 ? coord.length - 1 : j - 1;

      //   var currPoint = coord[currIndex];
      //   var prevPoint = coord[prevIndex];

      //   // console.log(coord)
      //   // console.log(currIndex, prevIndex)
      //   // console.log(currPoint, prevPoint)
      //   var isOrthoLine = Math.abs(currPoint.x - prevPoint.x) < 0.5 || Math.abs(currPoint.y - prevPoint.y) < 0.5;

      //   if (!isOrthoLine) {
      //     coord[currIndex] = coord.splice(prevIndex, 1, coord[currIndex])[0];
      //   }
      // }
      // for (var j = 0; j < coord.length; j++) {
      //   var currIndex = j;
      //   var nextIndex = j - 1 < 0 ? coord.length - 1 : j - 1;

      //   var currPoint = coord[currIndex];
      //   var nextPoint = coord[nextIndex];

      //   // console.log(coord)
      //   // console.log(currIndex, nextIndex)
      //   // console.log(currPoint, nextPoint)
      //   var isOrthoLine = currPoint.x == nextPoint.x || currPoint.y == nextPoint.y;

      //   if (!isOrthoLine) {
      //     coord[currIndex] = coord.splice(nextIndex, 1, coord[currIndex])[0];
      //   }
      // }
      // console.log(i, coord.length, coord.reduce(function(x, y) {return x + ', ' + y.x + ' ' + y.y}, ''))
    }

    for (var j in coord) {
      if (j == 0) {
        path.M(coord[j].x, coord[j].y);
      } else {
        path.L(coord[j].x, coord[j].y);
      }
    }

    path.Z();

    var pathElement = document.getElementById(path.node.id)
    pathElement.setAttribute('class', 'cell')
    if (opts.state) {
      pathElement.dataset.layer = opts.state[i]
    }

    Cells.paths.push(path);

    (function(x) {
      if (isMobile) {
        // path.touchenter(function(event) {
        //   console.log(x)
        //   if (Cells.dragStart) {
        //     radio('cell-clicked').broadcast(x, true);
        //   }
        // });
        path.touchstart(function(event) {
          radio('cell-clicked').broadcast(x, false);
        });
      } else {
        path.mouseover(function(event) {
          if (Cells.dragStart) {
            radio('cell-clicked').broadcast(x, true);
          }
        });
        path.mousedown(function(event) {
          radio('cell-clicked').broadcast(x, false);
          Cells.dragStart = true;
        });
        path.mouseup(function(event) {
          Cells.dragStart = false;
        });
      }
    })(i);
  }
};

Cells.reset = function(state) {
  Cells.draw({
    reset: true,
    state: state
  });
};

module.exports = Cells;