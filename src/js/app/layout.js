// NOTE: We use data as a global object. To fix eventually.
var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var radio = require('radio');

var Layout = function(name, state, preset) {
  this.name = name;
  this.id = encodeURI(this.name);
  this.state = state;
  this.preset = preset === undefined ? false : preset;
  this.buttons = []
};

// TODO: do something if this fails to save in db
Layout.create = function(name, layout) {
  var result = new Layout(name, layout);

  return XHR('/app/' + data.id + '/new').post(JSON.stringify(result.serialize()))
    .then(function(testfit) {
      result.id = JSON.parse(testfit)._id;
      return result;
    });
};

Layout.prototype.createButton = function(parent, deleteEnabled) {
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
    radio('layout-update-from-state').broadcast(that);
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
  console.log(this.id)
  XHR('/app/' + data.id + '/testfits/' + this.id + '/edit/layout')
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
  XHR('/app/' + data.id + '/testfits/' + this.id + '/edit/name')
    .put(JSON.stringify({
      name: this.name
    }));
};

Layout.prototype.delete = function() {
  XHR('/app/' + data.id + '/testfits/' + this.id).delete();
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