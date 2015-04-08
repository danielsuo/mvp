var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var Layout = require('./layout');
var radio = require('radio');

var LayoutList = function() {
  this.layouts = [];
};

LayoutList.prototype.get = function(i) {
  return this.layouts[i];
};

LayoutList.prototype.createButtons = function(parent) {
  _.forOwn(this.layouts, function(layout, id) {
    layout.createButton(parent, function() {
      radio('layout-update-from-state').broadcast(layout);
      radio('selection-clear').broadcast();
    })
  });
};

LayoutList.prototype.loadFromPresets = function(layouts) {
  for (var i = 0; i < layouts.length; i++) {
    var layout = new Layout(layouts[i].name, layouts[i].state, true);
    this.layouts.push(layout);
  }
};

LayoutList.prototype.loadFromUserDefined = function(suiteId) {
  XHR('/app/' + suiteId + '/testfit').get()
    .then(function(response) {
      var layouts = JSON.parse(response);
      for (var i = 0; i < layouts.length; i++) {
        var layout = new Layout(layouts[i].name, layouts[i].layout, false);
        layout.id = layouts[i]._id;
        this.layouts.push(layout);
      }
    });
};

LayoutList.prototype.create = function(name, layoutState) {
  this.layouts.push(Layout.create(name, layoutState));

  return this.layouts.length - 1;
};

LayoutList.prototype.update = function(index) {
  this.layouts[index].update();
};

LayoutList.prototype.delete = function(index) {
  this.layouts[index].delete();
  this.layouts.splice(index, 1);
};

module.exports = LayoutList;