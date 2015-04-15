// NOTE: This mixes view and logic, but whatever

var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var Layout = require('./layout');
var radio = require('radio');

var LayoutList = function(viewParent, createParent) {
  this.layouts = {};
  this.presets = {};
  this.initial;
  this.viewParent = viewParent;
  this.createParent = createParent;

  this.registerHandlers();
};

LayoutList.prototype.get = function(id) {
  return this.layouts[id];
};

LayoutList.prototype.getPreset = function(id) {
  return this.presets[id];
};

LayoutList.prototype.loadFromPresets = function(layouts) {
  for (var i = 0; i < layouts.length; i++) {
    var layout = new Layout(layouts[i].name, layouts[i].state, true);
    layout.createListButton(this.createParent);
    this.presets[layout.id] = layout;
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
        layout.createListButton(that.viewParent);
        that.layouts[layout.id] = layout;
      }
    });
};

// Create a temporary object
LayoutList.prototype.draft = function(name, layoutState) {
  var that = this;

  var layout = Layout.draft(name, layoutState);
  layout.createListButton(this.viewParent);
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
  delete this.layouts[id];
};

LayoutList.prototype.duplicateLayout = function(id) {
  var layout = this.get(id);
  var newLayout = this.draft(layout.name, layout.state, false);

  this.commit(newLayout.id);

  return newLayout;
};

LayoutList.prototype.registerHandlers = function() {
  radio('layout-remove').subscribe([

    function(id) {
      this.remove(id);
    },
    this
  ]);

  radio('layout-duplicate').subscribe([

    function(id) {
      this.duplicateLayout(id);
    },
    this
  ]);
};

module.exports = LayoutList;