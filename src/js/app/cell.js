// NOTE: We rely on 'data' as a global variable. It's defined in main.js. We
// will eventually address this. Maybe.

var _ = require('../util/lodash');
var radio = require('radio');
var isMobile = require('../util/mobile').any;

var Cell = function(corners) {
  this.layer = 0;
  this.id = Cell.id;
  Cell.id++;

  this.corners = corners;
  this.center = this.findCenter();
  this.sortCorners();
  this.createDrawingPath();

  this.children = {};
  return this;
};

Cell.id = 0;

Cell.fromSVG = function(svg) {
  switch(svg.type) {
    case 'g':
      return Cell.fromLines(svg.children());
      break;
    case 'rect':
      return Cell.fromRect(svg);
      break;
    case 'polygon':
      return Cell.fromPolygon(svg);
      break;
  };
};

Cell.fromLines = function(lines) {
  return new Cell(Cell.extractCornersFromLines(lines));
};

Cell.fromRect = function(rect) {
  var tl = {
    x: rect.x(),
    y: rect.y()
  };

  var tr = {
    x: rect.x() + rect.width(),
    y: rect.y()
  };

  var bl = {
    x: rect.x(),
    y: rect.y() + rect.height()
  };

  var br = {
    x: rect.x() + rect.width(),
    y: rect.y() + rect.height()
  };

  return new Cell([tl, tr, bl, br]);
};

Cell.fromPolygon = function(polygon) {
  return new Cell(polygon.array.value.map(function(corner) {
    return {
      x: corner[0],
      y: corner[1]
    };
  }));
};

Cell.extractCornersFromLines = function(lines) {
  // Grab all line segment ends
  var corners = lines.map(function(line) {
    return [{
      x: line.attr('x1'),
      y: line.attr('y1')
    }, {
      x: line.attr('x2'),
      y: line.attr('y2')
    }];
  });

  // Flatten and remove duplicates
  corners = _(corners).flattenDeep()
    .remove(function(item, pos, self) {
      for (var i = pos + 1; i < self.length; i++)
        if (_.isEqual(item, self[i]))
          return false;
      return true
    }).value();

  return corners;
};

Cell.merge = function(cells) {
  // For now just join corners; don't bother deleting duplicate corners
  var corners = [];
  _.forOwn(cells, function(cell, id) {
    corners = _.union(corners, cell.corners);
  });

  var merged = new Cell(corners);

  _.forOwn(cells, function(cell, id) {
    // Add all merging cells as children
    merged.children[id] = cell;

    // Remove drawing elements of children
    cell.demote();
  });

  merged.promote();

  return merged;
};

Cell.split = function(merged) {
  _.forOwn(merged.children, function(cell, id) {
    cell.promote();
  });

  return merged.children;
};

// What happens when a cell gets unmerged
Cell.prototype.promote = function() {
  this.createDrawingPath();
  this.createClippingPath(data.getClientToSVGRatio());
};

// What happens when a cell gets merged into another
Cell.prototype.demote = function() {
  this.removeDrawingPath();
  this.removeClippingPath();
};

Cell.prototype.findCenter = function() {
  var center = this.corners.reduce(function(a, b) {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }, {
    x: 0,
    y: 0
  });

  return {
    x: center.x / this.corners.length,
    y: center.y / this.corners.length
  };
};

Cell.prototype.sortCorners = function() {
  var that = this;

  that.corners.sort(function(a, b) {
    if (a.x - that.center.x >= 0 && b.x - that.center.x < 0) {
      return 1;
    }
    if (a.x - that.center.x < 0 && b.x - that.center.x >= 0) {
      return -1;
    }
    if (a.x - that.center.x == 0 && b.x - that.center.x == 0) {
      if (a.y - that.center.y >= 0 || b.y - that.center.y >= 0) {
        return a.y > b.y ? 1 : -1;
      }
      return b.y > a.y ? 1 : -1;
    }

    // compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - that.center.x) * (b.y - that.center.y) - (b.x - that.center.x) * (a.y - that.center.y);
    if (det < 0) {
      return 1;
    }
    if (det > 0) {
      return -1;
    }

    // points a and b are on the same line from the center
    // check which point is closer to the center
    var d1 = (a.x - that.center.x) * (a.x - that.center.x) + (a.y - that.center.y) * (a.y - that.center.y);
    var d2 = (b.x - that.center.x) * (b.x - that.center.x) + (b.y - that.center.y) * (b.y - that.center.y);
    return d1 > d2 ? 1 : -1;
  });

  for (var i = 0; i < that.corners.length; i++) {
    var indices = [0, 1, 2, 3].map(function(x) {
      return (i + x) % that.corners.length;
    });

    var pts = indices.map(function(x) {
      return that.corners[x];
    });

    if ((pts[1].x == pts[2].x || pts[1].y == pts[2].y) && // 1st and 2nd points are on horizontal or vertical line
      (pts[0].x == pts[2].x || pts[0].y == pts[2].y) && // 0th and 2nd points are on horizontal or vertical line
      (pts[1].x == pts[3].x || pts[1].y == pts[3].y) // 1st and 3rd points are on horizontal or vertical line
    ) {
      that.corners[indices[1]] = that.corners.splice(indices[2], 1, that.corners[indices[1]])[0];
    }
  }
};

Cell.prototype.createDrawingPath = function() {
  var that = this;

  that.drawingPath = data.path();
  that.drawingPath.node.setAttribute('class', 'cell');

  that.corners.map(function(corner, index) {
    if (index == 0) {
      that.drawingPath.M(corner.x, corner.y);
    } else {
      that.drawingPath.L(corner.x, corner.y);
    }
  });

  that.drawingPath.Z();

  if (isMobile) {
    that.drawingPath.touchstart(function(event) {
      // Broadcast a cell click event, no dragging
      radio('cell-click').broadcast(that, false);
    });
  } else {
    that.drawingPath.mousedown(function(event) {
      radio('cell-click').broadcast(that, false);
      data.dragging = true;
    });
    that.drawingPath.mouseover(function(event) {
      if (data.dragging) {
        radio('cell-click').broadcast(that, true);
      } else {
        radio('cell-mouseover').broadcast(that);
      }
    });
    that.drawingPath.mouseout(function(event) {
      radio('cell-mouseout').broadcast(that);
    });
    that.drawingPath.mouseup(function(event) {
      radio('cell-mouseup').broadcast(that);
      data.dragging = false;
    });
  }
};

Cell.prototype.removeDrawingPath = function() {
  if (this.drawingPath) {
    this.drawingPath.remove();
    delete this.drawingPath;
  }
};

Cell.prototype.createClippingPath = function(ratio) {
  var that = this;
  var transformedCorners = that.corners.map(function(corner) {
    return {
      x: corner.x * ratio,
      y: corner.y * ratio
    };
  });

  that.clippingPath = data.path();
  transformedCorners.map(function(corner, index) {
    if (index == 0) {
      that.clippingPath.M(corner.x, corner.y);
    } else {
      that.clippingPath.L(corner.x, corner.y);
    }
  });
  that.clippingPath.Z();
  that.clippingPath.remove();
};

Cell.prototype.removeClippingPath = function(ratio) {
  if (this.clippingPath) {
    this.clippingPath.remove();
    delete this.clippingPath;
  }
};

Cell.prototype.setData = function(attr, value) {
  this.drawingPath.node.dataset[attr] = value;
};

Cell.prototype.setLayer = function(layer) {
  this.setData('layer', layer);
  this.layer = layer;
};

Cell.prototype.numChildren = function() {
  return _.keys(this.children).length;
};

radio('cell-mouseover').subscribe(function(cell) {
  cell.drawingPath.node.dataset.hover = 1;
});

radio('cell-mouseout').subscribe(function(cell) {
  cell.drawingPath.node.dataset.hover = 0;
});

module.exports = Cell;