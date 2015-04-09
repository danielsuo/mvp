var _ = require('../util/lodash');
var Cell = require('./cell');
var XHR = require('../util/xhr');

var radio = require('radio');

var CellList = function(cells) {
  this.cells = {};
  this.selected = {};

  var cellData = cells.roots()[0].children();
  var viewbox = cells.roots()[0].viewbox();

  // Give the SVG a size
  data.viewbox(viewbox.x, viewbox.y, viewbox.width, viewbox.height);

  data.config.width = viewbox.width;
  data.config.height = viewbox.height;

  for (var i = 0; i < cellData.length; i++) {
    // Parse cell data
    var cell = Cell.fromSVG(cellData[i].children()[0]);

    // Assign cell to cell.id
    this.cells[cell.id] = cell;
  }

  // Remove from DOM. We should be able to just parse SVG and load into DOM, but
  // leaving as is for now.
  cells.remove();

  this.registerHandlers();

  return this;
};

// Load cell data from url into SVG object
CellList.load = function(data, url) {
  return XHR(url).get().then(function(response) {
    return new CellList(data.svg(response));
  });
};

CellList.prototype.get = function(id) {
  return this.cells[id];
};

CellList.prototype.set = function(cell) {
  return this.cells[cell.id] = cell;
};

CellList.prototype.remove = function(id) {
  this.cells[id].demote();
  delete this.selected[id];
  delete this.cells[id];
};

CellList.prototype.removeSelected = function() {
  _.forOwn(this.selected, function(cell, id) {
    this.remove(id);
  }, this);
};

CellList.prototype.map = function(func) {
  _.forOwn(this.cells, func, this);
};

CellList.prototype.mergeWithLayer = function(cells, layerIndex, update) {
  if (this.mergeable(cells)) {
    var merged = Cell.merge(cells);
    this.set(merged);

    _.forOwn(cells, function(cell, id) {
      this.remove(id);
    }, this);

    merged.setLayer(layerIndex);
  }

  if (update) radio('layout-update-from-state').broadcast();
};

// TODO: recursive split?
CellList.prototype.splitWithLayer = function(cells, layerIndex, update) {
  _.forOwn(cells, function(cell, id) {

    var layerIndexDefined = layerIndex === undefined || layerIndex === null;

    cell.setLayer(layerIndexDefined ? cell.layer : layerIndex);

    if (cell.numChildren() > 1) {
      var children = Cell.split(cell);

      _.forOwn(children, function(child, childId) {
        this.set(child);
        child.setLayer(layerIndexDefined ? child.layer : layerIndex);
      }, this);

      this.remove(id);
    }
  }, this);

  this.deselectAll();
  if (update) radio('layout-update-from-state').broadcast();
};

// Assume for now that if center of cells are colinear, then cells are in a
// line and can be merged
CellList.prototype.mergeable = function(cells) {
  var numToMerge = _.keys(cells).length
  if (numToMerge > 1 && numToMerge <= 3) {
    var line = _.transform(cells, function(result, child, id) {
      result.x = result.x === undefined ? child.center.x :
        Math.abs(result.x - child.center.x) < 20 ? child.center.x : false;
      result.y = result.y === undefined ? child.center.y :
        Math.abs(result.y - child.center.y) < 20 ? child.center.y : false;
    });

    // If in a line (weirdly written in case both line.x and line.y are 0),
    // check if adjacent
    if ((line.x || line.y) !== false) {

      var allAdjacent = true;

      // Loop over all children
      _.forOwn(cells, function(child, id) {

        var cell = this.get(id);
        var adjacent = false;

        // Loop over all siblings
        _.forOwn(cells, function(child2, id2) {
          if (id !== id2) {
            var cell2 = this.get(id2);

            // Make sure cell 1 and cell 2 share at least 1 corner
            if (_.intersectionPoints(cell.corners, cell2.corners).length >= 1) {
              adjacent = true;
            }
          }
        }, this);

        allAdjacent &= adjacent;
      }, this);

      return allAdjacent;
    }
  }

  return false;
};

CellList.prototype.updateClippingPaths = function(ratio) {
  this.map(function(cell, id) {
    cell.createClippingPath(ratio);
  });
};

CellList.prototype.select = function(id) {
  this.selected[id] = this.cells[id];
  this.cells[id].setData('selected', 1);
};

CellList.prototype.deselect = function(id) {
  delete this.selected[id];
  this.cells[id].setData('selected', 0);
};

CellList.prototype.selectAll = function() {
  this.map(function(cell, id) {
    this.select(id);
  });
};

CellList.prototype.deselectAll = function() {
  _.forOwn(this.selected, function(cell, id) {
    this.deselect(id);
  }, this);
};

CellList.prototype.isSelected = function(id) {
  return _.has(this.selected, id);
};

CellList.prototype.numSelected = function(id) {
  return _.keys(this.selected).length;
};

CellList.prototype.getLayout = function() {
  // Initialize a layout object to stringify
  var layout = {};

  // Process children of merged cells
  var processChildren = function(cell, id, currLayoutObj, layoutObj) {

    // If the cell has children, do something; otherwise, do nothing
    if (_.keys(cell.children).length > 0) {

      // Initialize a children object for the current cell
      currLayoutObj.children = {};

      // Loop through all the children in the cell
      _.forOwn(cell.children, function(child, cid) {

        // Add child to the layout object 
        currLayoutObj.children[cid] = {
          layer: child.layer
        };

        if (child.disabled) currLayoutObj.children[cid].disabled = true;

        // Delete child from top-level layout
        delete layoutObj[cid];

        // Process any children of the child
        processChildren(child, cid, currLayoutObj.children[cid], layoutObj);
      });
    }
  };

  this.map(function(cell, id) {
    layout[id] = {
      layer: cell.layer
    };

    if (cell.disabled) layout[id].disabled = true;

    processChildren(cell, id, layout[id], layout);
  });

  return layout;
};

CellList.prototype.setLayout = function(layout) {
  this.selectAll();
  this.splitWithLayer(this.selected, null, false);

  var processChildren = function(cell, id, that) {
    if (_.keys(cell.children).length > 0) {
      var children = {};
      _.forOwn(cell.children, function(child, cid) {
        processChildren(child, cid, that);
        children[cid] = that.get(cid);
      });

      that.mergeWithLayer(children, cell.layer, false);
    } else {
      that.get(id).setLayer(cell.layer);
      if (cell.disabled) that.get(id).disable();
      that.get(id).seats = data.layers[cell.layer].getNumSeats(id);
    }
  };

  _.forOwn(layout, function(cell, id) {
    processChildren(cell, id, this);
  }, this);
};

CellList.prototype.paintLayoutFromPreset = function(preset, layers) {
  this.setLayout(preset);
  this.paintLayout(layers)
};

CellList.prototype.paintLayout = function(layers) {
  layers.map(function(layer) {
    layer.clear();
  });

  this.setSeats(layers);

  this.drawCells(layers);
  this.forceCSSUpdate();
};

CellList.prototype.getClippingPaths = function() {
  // Only return top-level clips
  var clippingPaths = {};

  this.map(function(child, id) {
    clippingPaths[id] = child.clippingPath;
  });

  return clippingPaths;
};

CellList.prototype.drawCells = function(layers) {
  var ratio = data.getClientToSVGRatio();
  this.map(function(cell, id) {
    if (cell.disabled) return;

    var layer = layers[cell.layer];

    if (cell.merged()) {
      cell.erase();
      cell.draw();
    } else if (!layer.disabled) {
      cell.createClippingPath(ratio);
      layer.clip(cell.clippingPath);
    }
  });
};

CellList.prototype.registerHandlers = function() {
  // Handle cell clicks
  radio('cell-click').subscribe([

    function(cell, dragging) {

      if (cell.disabled) {
        // console.log('disabled')
        return;
      }

      if (this.selectionWasUpdated) {
        this.deselectAll();
        this.selectionWasUpdated = false;
      }

      console.log(cell.id, cell.corners[0], cell.corners[1], cell.corners[2], cell.corners[3])
      var selected = this.isSelected(cell.id);

      $('#panel').addClass('show-editor');

      if (dragging) {

      } else {
        this.multiSelectState = selected;
      }

      // Unhighlight cell
      // if we mouse down on first cell and already selected
      // if we mouse over other selected cells and first cell was selected to begin with
      if ((!dragging && this.multiSelectState) || (selected && dragging && this.multiSelectState)) {
        this.deselect(cell.id);
      }

      // Highlight cell
      // if we mouse down on first cell and not already selected
      // if we mouse over other selected cell and first cell was not selected to begin with
      else if ((!dragging && !this.multiSelectState) || (!selected && dragging && !this.multiSelectState)) {
        this.select(cell.id);
      }

      radio('selection-change').broadcast();
    },
    this
  ]);

  // Handle selection change
  radio('selection-change').subscribe([

    function() {
      var numSelected = this.numSelected();
      var mergeable = this.mergeable(this.selected);
      if (numSelected) {
        $('#panel .editor, #protofit').removeClass('no-selection').addClass('has-selection')
      } else {
        $('#panel .editor, #protofit').addClass('no-selection').removeClass('has-selection')
      }
      if (mergeable && (numSelected == 2 || numSelected == 3)) {
        $('#panel .editor').removeClass('no-merge-big')
      } else {
        $('#panel .editor').addClass('no-merge-big');
      }

    },
    this
  ]);

  // Handle selection clear
  radio('selection-clear').subscribe([

    function() {
      this.deselectAll();
      radio('selection-change').broadcast();
    },
    this
  ]);

  // Handle merge request
  radio('merge-initiated').subscribe([

    function(layer) {
      this.mergeWithLayer(this.selected, layer, true);
    },
    this
  ]);

  // Handle merge request
  radio('split-initiated').subscribe([

    function() {
      this.splitWithLayer(this.selected, null, true);
    },
    this
  ]);
};

// This is unbelievably hacky. We could just remove / recreate the clips each
// time.
CellList.prototype.forceCSSUpdate = function() {
  var force = document.createElement('div');
  var svg = document.getElementById('svg');

  svg.appendChild(force);
  setTimeout(function() {
    svg.removeChild(force);
  }, 1000);
};


// Seating functions
CellList.prototype.setSeats = function(layers) {
  this.map(function(cell, id) {
    cell.seats = layers[cell.layer].getNumSeats(id);
  });
};

CellList.prototype.getHeadcount = function(layerIndices) {
  var headcount = 0;
  this.map(function(cell, id) {
    if (layerIndices === undefined || layerIndices.indexOf(cell.layer) > -1)
      headcount += cell.seats;
  });
  return headcount;
};

CellList.prototype.getBenchingHeadcount = function() {
  return this.getHeadcount([0]); // Benching
};

CellList.prototype.getNumCellsByLayer = function(layerIndex) {
  var num = 0;
  this.map(function(cell, id) {
    if (cell.layer === layerIndex) num++;
  });
  return num;
};

module.exports = CellList;