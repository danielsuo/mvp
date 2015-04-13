var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var Layout = require('./layout');
var radio = require('radio');

var LayoutList = function() {
  this.layouts = {};
  this.initial;
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

LayoutList.prototype.get = function(id) {
  return this.layouts[id];
};

LayoutList.prototype.createButtons = function(parent, deleteEnabled, newTestfit) {
  _.forOwn(this.layouts, function(layout, id) {
    layout.createButton(parent, deleteEnabled, newTestfit);
  });
};

// TODO: createTestfitButtons
// TODO: viewTestfitButtons

LayoutList.prototype.loadFromPresets = function(layouts) {
  for (var i = 0; i < layouts.length; i++) {
    var layout = new Layout(layouts[i].name, layouts[i].state, true);
    this.layouts[layout.id] = layout;
    if (i == 0) this.initial = layout.id;
  }
};

LayoutList.prototype.loadFromUserDefined = function(suiteId) {
  var that = this;

  XHR('/app/' + suiteId + '/testfits').get()
    .then(function(response) {
      var layouts = JSON.parse(response);
      for (var i = 0; i < layouts.length; i++) {
        var layout = new Layout(layouts[i].name, layouts[i].layout, false);
        layout.dbid = layouts[i]._id;
        layout.createButton(that.parent, true);
        that.layouts[layout.id] = layout;
      }
    });
};

// Create a temporary object
LayoutList.prototype.draft = function(name, layoutState) {
  var that = this;

  var layout = Layout.draft(name, layoutState);
  layout.createButton(this.parent, true);
  this.layouts[layout.id] = layout;

  return layout;
};

LayoutList.prototype.commit = function(id) {
  var that = this;

  // Save to database;
  that.layouts[id].commit().then(
    function(dbid) {
      that.layouts[id].dbid = dbid;
    });
};

LayoutList.prototype.update = function(index, layout) {
  this.layouts[index].update(layout);
};

LayoutList.prototype.remove = function(id) {
  $('#' + this.layouts[id].id).remove();
  this.layouts[id].delete();
  delete this.layouts[id];
};

module.exports = LayoutList;