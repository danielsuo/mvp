var _ = require('lodash');
var Cell = require('./cell');
var XHR = require('../util/XHR');

var radio = require('radio');

var CellList = function(cells) {
  this.cells = {};
  this.selected = {};

  var cellData = cells.roots()[0].children();

  for (var i = 0; i < cellData.length; i++) {
    // Parse cell data
    var cell = Cell.fromLines(cellData[i].children());

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

  radio('layout-update-from-state').broadcast();
};

CellList.prototype.map = function(func) {
  _.forOwn(this.cells, func);
};

CellList.prototype.mergeWithLayer = function(layerIndex) {
  // For now, always can merge selected
  var mergeable = true;

  if (mergeable) {
    var merged = Cell.merge(this.selected);
    this.set(merged);
    this.removeSelected();
    merged.setLayer(layerIndex);
  }

  radio('layout-update-from-state').broadcast();
};

CellList.prototype.splitWithLayer = function(layerIndex) {
  _.forOwn(this.selected, function(cell, id) {

    if (cell.numChildren() > 1) {
      var children = Cell.split(cell);

      _.forOwn(children, function(child, childId) {
        this.set(child);
        child.setLayer(layerIndex);
      }, this);

      this.remove(id);
    }
  }, this);

  this.deselectAll();
  radio('layout-update-from-state').broadcast();
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
  _.forOwn(this.selected, function(cell, id) {
    this.select(id);
  }, this);
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
  var layout = {};
  this.map(function(cell, id) {
    layout[id] = {
      layer: cell.layer
    };
  });

  return layout;
};

CellList.prototype.setLayout = function(layout) {
  _.forOwn(layout, function(cell, id) {
    this.get(id).layer = cell.layer;
  }, this);
};

CellList.prototype.registerHandlers = function() {
  // Handle cell clicks
  radio('cell-click').subscribe([

    function(cell, dragging) {
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
      this.mergeWithLayer(1);
    },
    this
  ]);

  // Handle merge request
  radio('split-initiated').subscribe([

    function() {
      this.splitWithLayer(1);
    },
    this
  ]);
};

// // Assume for now that if center of cells are colinear, then cells are in a
// // line and can be merged
// if (data.selected.length > 1 && data.selected.length <= 3) {
//   var line = data.selected.reduce(function(a, b) {
//     return {
//       x: (a.x === data.cells.get(b).center.x ? a.x : false),
//       y: (a.y === data.cells.get(b).center.y ? a.y : false)
//     };
//   }, {
//     x: data.cells.get(data.selected[0]).center.x,
//     y: data.cells.get(data.selected[0]).center.y
//   });

//   if (line.x || line.y) radio('merge-possible').broadcast();
// }

module.exports = CellList;