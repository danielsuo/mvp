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

if (isMobile) {
  window.addEventListener('touchstart', function(event) {
    Cells.dragStart = true;
  }, false);

  window.addEventListener('touchend', function(event) {
    Cells.dragStart = false;
  }, false);
} else {
  window.addEventListener('mousedown', function(event) {
    Cells.dragStart = true;
  }, false);

  window.addEventListener('mouseup', function(event) {
    Cells.dragStart = false;
  }, false);
}

module.exports = Cells;