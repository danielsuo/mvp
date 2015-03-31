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
    var cell = new Cell(cellData[i].children());

    // Create cell drawing paths
    cell.createDrawingPath();

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
CellList.load = function(svg, url) {
  return XHR.get(url).then(function(response) {
    return new CellList(svg.svg(response));
  });
};

CellList.prototype.get = function(id) {
  return this.cells[id];
};

CellList.prototype.set = function(cell) {
  return this.cells[cell.id] = cell;
};

CellList.prototype.map = function(func) {
  _.forOwn(this.cells, func);
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

CellList.prototype.registerHandlers = function() {
  // Handle cell clicks
  radio('cell-click').subscribe([function(cell, dragging) {
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
  }, this]);
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