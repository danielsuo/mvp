// NOTE: We use data as a global object. To fix eventually.
var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var radio = require('radio');

var Layout = function(name, state, preset) {
  this.name = name;
  this.id = encodeURI(this.name).toLowerCase();

  // database-assigned id for user-defined
  this.dbid;

  this.state = state;
  this.preset = preset === undefined ? false : preset;

  if (!this.preset) {
    this.id += String(Layout.count++);
  }
};

Layout.count = 0;

// TODO: do something if this fails to save in db
Layout.draft = function(name, layout) {
  return new Layout(name, layout);
};

Layout.prototype.commit = function() {
  return XHR('/app/' + data.id + '/new').post(JSON.stringify(this.serialize()))
    .then(function(testfit) {
      return JSON.parse(testfit)._id;
    });
};

Layout.prototype.createListButton = function(parent, func) {
  var that = this;

  var $li = $(document.createElement('li'));
  $li.attr('id', that.id);
  $li.html(that.name).data('index', that.index);

  that.button = $li;

  if (!that.preset) {
    that.createDeleteButton(that.button);
    that.createDuplicateButton(that.button);
  }

  $li.click(function() {
    $(this).parent().parent().find('li').removeClass('active');
    $(this).addClass('active');

    if (that.preset) {
      data.layouts.get(data.currentTestfit).state = that.state;
    } else {
      data.currentTestfit = that.id;
    }

    if (that.preset) {
      $('#panel .list button.edit').attr('disabled', true)
      // $('#protofit').addClass('no-pointer-events')
    } else {
      $('#panel .list button.edit').removeAttr('disabled')
      // $('#protofit').removeClass('no-pointer-events')
    }

    radio('layout-update-from-state').broadcast(that, that.preset);
    radio('selection-clear').broadcast();
  });

  if (that.preset) {
    parent.find('ul').last().append($li);
  } else {
    parent.find('ul').first().append($li);
  }
};

Layout.prototype.createDeleteButton = function(parent) {
  var that = this;

  var $deleteBtn = $('<div class="btn x"></div>');
  $deleteBtn.click(function() {
    that.delete();
  });

  parent.append($deleteBtn);
};

Layout.prototype.createDuplicateButton = function(parent) {
  var that = this;

  var $duplicateBtn = $('<div class="btn duplicate"></div>');
  $duplicateBtn.click(function() {
    radio('layout-duplicate').broadcast(that.id);
  })

  parent.append($duplicateBtn);
};

Layout.prototype.createEditButton = function(parent) {

};

Layout.prototype.updateLayout = function(layout) {
  this.state = layout;
  XHR('/app/' + data.id + '/testfits/' + this.dbid + '/edit/layout')
    .put(JSON.stringify({
      layout: this.state
    }));
};

Layout.prototype.updateName = function(name) {
  this.name = name;
  this.button.html(name);
  for (var i in this.buttons) {
    var $button = this.buttons[i]
    $button.html(name);
  }
  XHR('/app/' + data.id + '/testfits/' + this.dbid + '/edit/name')
    .put(JSON.stringify({
      name: this.name
    }));
};

Layout.prototype.delete = function() {
  if (this.dbid) {
    XHR('/app/' + data.id + '/testfits/' + this.dbid).delete();
  }

  if (this.button) {
    this.button.remove();
  }

  radio('layout-remove').broadcast(this.id);
};

Layout.prototype.serialize = function() {
  return {
    name: this.name,
    layout: this.state,
    createdAt: new Date()
  };
};

Layout.prototype.deserialize = function(data) {
  var layout = new Layout(data.name, data.layout);
  layout.id = data.id;
  return layout;
};

module.exports = Layout;