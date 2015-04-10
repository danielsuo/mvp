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

  this.buttons = []
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

Layout.prototype.createButton = function(parent, deleteEnabled, newTestfit) {
  var that = this;

  var $li = $(document.createElement('li'));
  $li.attr('id', that.id);
  $li.html(that.name).data('index', that.index);


  if (deleteEnabled && !that.preset) {
    var $deleteBtn = $('<div class="btn x"></div>');
    $deleteBtn.click(function() {
      that.delete();
      // TODO: unfuck that
      $(this).parent().remove();
      radio('layout-remove').broadcast(that.id);
    })
    $li.append($deleteBtn);
  }

  $li.click(function() {
    $(this).parent().parent().find('li').removeClass('active');
    $(this).addClass('active');

    if (newTestfit) {
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
    
    radio('layout-update-from-state').broadcast(that, newTestfit);
    radio('selection-clear').broadcast();
  });

  if (that.preset) {
    parent.find('ul').last().append($li);
  } else {
    parent.find('ul').first().append($li);
  }
  this.buttons.push($li);
};

Layout.prototype.updateLayout = function(layout) {
  this.state = layout;
  console.log(this.dbid)
  XHR('/app/' + data.id + '/testfits/' + this.dbid + '/edit/layout')
    .put(JSON.stringify({
      layout: this.state
    }));
};

Layout.prototype.updateName = function(name) {
  this.name = name;
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