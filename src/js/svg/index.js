var SVG = require('svg.js');
require('../ixn/draggable');
require('../ixn/select');
require('../ixn/resize');
require('./path');
require('./topath');
require('./parser');
require('./import');
require('./math');
require('./easing');
require('./export');

SVG.load = require('./load');

SVG.ConstrainedRect = SVG.invent({
  create: 'rect',
  inherit: SVG.Rect,
  extend: {
    // Get corners
    tl: function() {
      return {
        x: this.l(),
        y: this.t()
      };
    },
    tr: function() {
      return {
        x: this.r(),
        y: this.t()
      };
    },
    bl: function() {
      return {
        x: this.l(),
        y: this.b()
      };
    },
    br: function() {
      return {
        x: this.r(),
        y: this.b()
      };
    },

    // Get or set top
    t: function(val, resize) {
      if (typeof(resize) === 'undefined') resize = false;
      if (val && resize) {
        var height = this.height() - (val - this.y());
        if (height >= 0) {
          this.y(val);
          this.height(height);
        }
        return this;
      } else if (val && !resize) {
        this.y(val);
      } else {
        return this.y();
      }
    },
    // Get or set bottom
    b: function(val, resize) {
      if (typeof(resize) === 'undefined') resize = false;
      if (val && resize) {
        var height = this.height() + (val - this.y() - this.height());
        if (height >= 0) this.height(height);
        return this;
      } else if (val && !resize) {
        this.y(val - this.height());
      } else {
        return this.y() + this.height();
      }
    },
    // Get or set left
    l: function(val, resize) {
      if (typeof(resize) === 'undefined') resize = false;
      if (val && resize) {
        var width = this.width() - (val - this.x());
        if (width >= 0) {
          this.x(val);
          this.width(width);
        }
        return this;
      } else if (val && !resize) {
        this.x(val);
      } else {
        return this.x();
      }
    },
    // Get or set right
    r: function(val, resize) {
      if (typeof(resize) === 'undefined') resize = false;
      if (val && resize) {
        var width = this.width() + (val - this.x() - this.width());
        if (width >= 0) this.width(width);
        return this;
      } else if (val && !resize) {
        this.x(val - this.width());
      } else {
        return this.x() + this.width();
      }
    },

    getCorners: function() {
      return [this.tl(), this.tr(), this.bl(), this.br()];
    },
    getCornersByNearest: function(point) {
      // Get corners each time because corners may change
      var corners = this.getCorners();
      var sqDist = function(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
      }
      corners.sort(function(a, b) {
        return sqDist(point, a) > sqDist(point, b) ? 1 : -1;
      })
      return corners;
    }
  },
  construct: {
    constrainedRect: function(width, height) {
      var rect = new SVG.ConstrainedRect().size(width, height);
      return this.put(rect);
    }
  }
});

var attr = {
  internal: {
    'stroke': '#f0f',
    'stroke-width': 5
  },
  external: {
    'stroke': '#000',
    'stroke-width': 10
  },
  glass: {
    'stroke-opacity': 0.4
  },
  windows: {
    'stroke-dasharray': '10, 10',
    'stroke-opacity': 0.4
  },
  circulation: {
    'stroke': '#00f',
  }
};

// var params = require('../params');
var params = {
  door: {
    entryWidth: 10,
    swingAngle: 60
  }
};

SVG.Cell = SVG.invent({
  create: 'g',
  inherit: SVG.G,
  extend: {
    getDoorLocationCandidates: function() {
      // Check to see if each segment point is within 'Threshhold' of door
      // Check to see if segment length is long enough to fit door
      var candidates = [];
      var door = new SVG.Door();
      for (var i = 0; i < this.circulation.length; i++) {
        console.log(this.circulation[i])
        var segment = this.circulation[i];
        var points = this.getSegmentPoints(segment);

        var nearestCorner = this.cell.getCornersByNearest(points.start)[0];

        candidates.push(this.cell.getCornersByNearest(points.end)[0]);
      }
      console.log(candidates)
    },
    getSegmentPoints: function(segment) {
      var result = {
        start: {
          x: null,
          y: null
        },
        end: {
          x: null,
          y: null
        }
      };

      if (segment.side == 't' || segment.side == 'b') {
        result.start.x = segment.start;
        result.end.x = segment.end;

        result.start.y = result.end.y = segment.side == 't' ? 0 : this.cell.height();
      } else if (segment.side == 'l' || segment.side == 'r') {
        result.start.y = segment.start;
        result.end.y = segment.end;

        result.start.x = result.end.x = segment.side == 'l' ? 0 : this.cell.width();
      }

      return result;
    },
    getSegments: function(key, value) {
      valueExists = typeof(value) === 'undefined';
      return this.segments.filter(function(element, index, array) {
        return element.hasOwnProperty(key) && (valueExists || element[key] == value);
      });
    },
    showSegments: function() {
      for (var i = 0; i < this.types.length; i++) {
        var type = this[this.types[i]];
        for (var j = 0; j < type.length; j++) {
          var points = this.getSegmentPoints(type[j]);
          if (!type[j].path) {
            type[j].path = this.path();
          }

          type[j].path.M(points.start.x, points.start.y);
          type[j].path.L(points.end.x, points.end.y);
          if (attr[this.types[i]] != undefined) type[j].path.attr(attr[this.types[i]]);
        }
      }
    }
  },
  construct: {
    cell: function(data) {
      var g = new SVG.Cell();

      g.move(data.x, data.y);
      g.cell = g.constrainedRect(data.width, data.height);
      g.cell.attr({
        'fill-opacity': 0.5
      });

      g.segments = data.segments;

      // Create convenience arrays for wall types
      g.types = ['internal', 'demizing', 'glass', 'solid', 'circulation', 'partition', 'external', 'windows'];
      for (var i = 0; i < g.types.length; i++) {
        g[g.types[i]] = g.getSegments(g.types[i]);
      }

      // Create convenience arrays for cell sides
      g.sides = ['t', 'b', 'l', 'r'].reduce(function(result, side) {
        result[side] = g.getSegments('side', side);
        return result;
      }, {});

      g.corners = g.cell.getCorners();

      g.showSegments();

      return this.put(g);
    }
  }
});

SVG.Wedge = SVG.invent({
  create: 'path',
  inherit: SVG.Path,
  extend: {},
  construct: {
    wedge: function(radius, cx, cy, startAngle, totalAngle, ccw) {
      startAngle = startAngle || 0;
      totalAngle = totalAngle * Math.PI / 180 || Math.PI / 4;
      if (typeof(ccw) === 'undefined') ccw = true;
      ccw = ccw ? 0 : 1;

      var path = new SVG.Path();

      // Give some aesthetic attributes
      path.attr({
        stroke: '#f06'
      });

      // Move the path to begin at the specified origin for the wedge
      path.M(cx, cy);

      // Draw the initial line
      path.l(radius, 0);

      // console.log(Math.cos(endAngle) * radius)
      // console.log(Math.sin(endAngle) * radius)

      // The x axis rotation is used to rotate the ellipse that the arc is
      // created from. This rotation maintains the start and end points, whereas
      // a rotation with the transform attribute (outside the path description)
      // would cause the entire path, including the start and end points, to be
      // rotated.
      var xAxisRotate = 0;

      // The large arc flag has a value of 0 or 1 and determines whether the
      // smallest (0) or largest (1) arc is drawn
      var largeArcFlag = totalAngle > Math.PI ? 1 : 0;

      // The sweep flag has a value of 0 or 1 and determines whether the arc
      // should be swet in a clockwise (1) or counter-clockwise (0) direction.
      var sweepFlag = ccw;

      // The x and y radii specify the radius of the ellipse the arc is drawn
      // from
      var xRadius = yRadius = radius;

      // The end point passed to a (vs. A) is relative to the previous point on
      // the path. In this case, relative to the end of the initial line
      var endPoint = {
        x: Math.cos(totalAngle) * radius - radius,
        y: Math.sin((ccw ? 1 : -1) * totalAngle) * radius
      };

      // Draw the arc
      path.a(xRadius, yRadius, xAxisRotate, largeArcFlag, sweepFlag, endPoint);

      // Close the path by drawing a line from the arc to the origin of the wedge
      path.Z();

      // Rotate the wedge as needed
      path.rotate(-startAngle, cx, cx)

      return this.put(path);
    }
  }
});

SVG.Door = SVG.invent({
  create: 'path',
  inherit: SVG.Wedge,
  extend: {},
  construct: {
    door: function(x, y, startAngle, ccw) {
      door.entryWidth = params.door.entryWidth;
      door.swingAngle = params.door.swingAngle;
      var door = new SVG.Wedge(door.entryWidth, x, y, startAngle, door.swingAngle, ccw);

      return this.put(door);
    }
  }
});

module.exports = SVG;