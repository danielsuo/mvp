var _ = require('../util/lodash');
var Cell = require('./cell');
var XHR = require('../util/xhr');

var radio = require('radio');

var CellList = function(cells) {
  this.cells = {};
  this.selected = {};

  var cellData = cells.roots()[0].children();

  for (var i = 0; i < cellData.length; i++) {
    // Parse cell data
    var cell = Cell.fromSVG(cellData[i]);

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
  return XHR.get(url).then(function(response) {
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

CellList.prototype.updateSelected = function(layerIndex) {
  _.forOwn(this.selected, function(cell, id) {
    cell.setLayer(layerIndex);
  });

  this.selectionWasUpdated = true;

  radio('layout-update-from-state').broadcast();
};

CellList.prototype.map = function(func) {
  _.forOwn(this.cells, func, this);
};

CellList.prototype.mergeWithLayer = function(cells, layerIndex, update) {
  if (this.mergeable()) {
    var merged = Cell.merge(cells);
    this.set(merged);

    _.forOwn(cells, function(cell, id) {
      this.remove(id);
    }, this);

    merged.setLayer(layerIndex);
  }

  if (update) radio('layout-update-from-state').broadcast();
};

CellList.prototype.splitWithLayer = function(cells, layerIndex, update) {
  _.forOwn(cells, function(cell, id) {

    if (cell.numChildren() > 1) {
      var children = Cell.split(cell);

      _.forOwn(children, function(child, childId) {
        this.set(child);
        child.setLayer(layerIndex || child.layer);
      }, this);

      this.remove(id);
    }
  }, this);

  this.deselectAll();
  if (update) radio('layout-update-from-state').broadcast();
};

// Assume for now that if center of cells are colinear, then cells are in a
// line and can be merged
CellList.prototype.mergeable = function() {
  var numSelected = this.numSelected();
  if (numSelected > 1 && numSelected <= 3) {
    var line = _.transform(this.selected, function(result, child, id) {
      result.x = result.x === undefined ? child.center.x :
        (result.x === child.center.x) ? child.center.x : false;
      result.y = result.y === undefined ? child.center.y :
        (result.y === child.center.y) ? child.center.y : false;
    });

    // If in a line (weirdly written in case both line.x and line.y are 0),
    // check if adjacent
    if ((line.x || line.y) !== false) {

      var allAdjacent = true;

      // Loop over all children
      _.forOwn(this.selected, function(child, id) {

        var cell = this.get(id);
        var adjacent = false;

        // Loop over all siblings
        _.forOwn(this.selected, function(child2, id2) {
          if (id !== id2) {
            var cell2 = this.get(id2);

            // Make sure cell 1 and cell 2 share at least 2 corners
            if (_.intersectionObjects(cell.corners, cell2.corners).length >= 2) {
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
      that.get(id).layer = cell.layer;
    }
  };

  _.forOwn(layout, function(cell, id) {
    processChildren(cell, id, this);
  }, this);
};

CellList.prototype.registerHandlers = function() {
  // Handle cell clicks
  radio('cell-click').subscribe([

    function(cell, dragging) {

      if (this.selectionWasUpdated) {
        this.deselectAll();
        this.selectionWasUpdated = false;
      }

      console.log(cell.id)
      var selected = this.isSelected(cell.id);

      $('#actions').addClass('show-editor');

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

      if (this.mergeable()) radio('merge-possible').broadcast();
    },
    this
  ]);

  // Handle selection change
  radio('selection-change').subscribe([

    function() {
      if (this.numSelected()) {
        $('#editor').removeClass('no-selection').addClass('has-selection')
      } else {
        $('#editor').addClass('no-selection').removeClass('has-selection')
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

    function() {
      this.mergeWithLayer(this.selected, 1, true);
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

module.exports = CellList;