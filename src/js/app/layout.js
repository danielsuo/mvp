// NOTE: We use data as a global object. To fix eventually.
var _ = require('../util/lodash');
var XHR = require('../util/xhr');
var radio = require('radio');

var Layout = function(name, state, preset) {
  this.name = name;
  this.id = encodeURI(this.name);
  this.state = state;
  this.preset = preset === undefined ? false : preset;
};

// TODO: do something if this fails to save in db
Layout.create = function(name, layout) {
  var result = new Layout(name, layout);

  XHR('/app/' + data.id + '/new').post(JSON.stringify(result.serialize()));

  return result;
};

Layout.prototype.createButton = function(parent) {
  var that = this;

  var $li = $(document.createElement('li'));
  $li.attr('id', that.id);
  $li.html(that.name).data('index', that.index);

  if (!that.preset) {
    var $deleteBtn = $('<div class="btn delete">X</div>');
    $deleteBtn.click(function() {
      that.delete();
      // TODO: unfuck that
      $(this).parent().remove();
      radio('layout-remove').broadcast(that.id);
    })
    $li.append($deleteBtn);
  }

  $li.click(function() {
    radio('layout-update-from-state').broadcast(that);
    radio('selection-clear').broadcast();
  });

  parent.append($li);
};

Layout.prototype.update = function(layout) {
  this.state = layout;
  XHR('/app/' + data.id + '/testfits' + this.id).put(JSON.stringify(result.serialize()));
};

Layout.prototype.delete = function() {
  XHR('/app/' + data.id + '/testfits/' + this.id).delete();
  // $.delete('/app/' + data.id + '/testfits/' + this.id)
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