var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var Layout = require('./layout');
var radio = require('radio');

var LayoutList = function() {
  this.layouts = [];
  this.parent;

  radio('layout-remove').subscribe([

    function(id) {
      for (var i = 0; i < this.layouts.length; i++) {
        if (this.layouts[i].id === id) {
          this.layouts.splice(i, 1);
          return;
        }
      }
      console.log(this.layouts.length)
    },
    this
  ])
};

LayoutList.prototype.get = function(i) {
  return this.layouts[i];
};

LayoutList.prototype.createButtons = function(parent, deleteEnabled) {
  _.forOwn(this.layouts, function(layout, id) {
    layout.createButton(parent, deleteEnabled)
  });
};

LayoutList.prototype.loadFromPresets = function(layouts) {
  for (var i = 0; i < layouts.length; i++) {
    var layout = new Layout(layouts[i].name, layouts[i].state, true);
    this.layouts.push(layout);
  }
};

LayoutList.prototype.loadFromUserDefined = function(suiteId) {
  var that = this;

  XHR('/app/' + suiteId + '/testfits').get()
    .then(function(response) {
      var layouts = JSON.parse(response);
      for (var i = 0; i < layouts.length; i++) {
        var layout = new Layout(layouts[i].name, layouts[i].layout, false);
        layout.id = layouts[i]._id;
        layout.createButton(that.parent, true);
        that.layouts.push(layout);
      }
    });
};

setTimeout(function() {
  console.log(data.layouts.get(7))
}, 5000)

LayoutList.prototype.add = function(name, layoutState) {
  var that = this;

  return Layout.create(name, layoutState)
    .then(function(layout) {
      layout.createButton(that.parent, true);
      that.layouts.push(layout);
      return that.layouts.length - 1;
    });
};

LayoutList.prototype.update = function(index, layout) {
  this.layouts[index].update(layout);
};

LayoutList.prototype.remove = function(index) {
  $('#' + this.layouts[index].id).remove();
  // this.layouts[index].delete();
  // this.layouts.splice(index, 1);
};

module.exports = LayoutList;