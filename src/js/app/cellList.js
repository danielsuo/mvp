var _ = require('lodash');
var Cell = require('./cell');
var XHR = require('../util/XHR');

var CellList = function(cells) {
  this.cells = {};
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

CellList.prototype.clearSelection = function() {
  this.map(function(cell, id) {
    document.getElementById(cell.drawingPath.node.id).dataset.selected = 0;
  })
};

module.exports = CellList;