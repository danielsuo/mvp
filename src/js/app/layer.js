// NOTE: We use data as a global object. To fix eventually.
var _ = require('../util/lodash');

var Layer = function(index, id, name) {
  this.index = index;
  this.id = id;
  this.name = name;

  this.file_path = data.dir + this.id + '.svg';
  this.disabled = ['shell'].indexOf(id) > -1;

  this.clippingPath = data.clip();

  // TODO: need seats

  return this;
};

// This is unbelievably hacky. We could just remove / recreate the clips each
// time.
Layer.forceCSSUpdate = function() {
  var force = document.createElement('div');
  var svg = document.getElementById('svg');

  svg.appendChild(force);
  setTimeout(function() {
    svg.removeChild(force);
  }, 1000);
};

Layer.prototype.draw = function() {
  this.element = document.createElement('div');
  this.element.id = this.id;

  document.getElementById('svg').appendChild(this.element);

  this.$element = $('#' + this.id);
  this.$element.css({
    'background-image': 'url(' + this.file_path + ')'
  });

  if (!this.disabled) {
    this.setClip();
  }
};

Layer.prototype.createButton = function(parent, func) {
  var $li = $(document.createElement('li'));
  $li.html(this.name).data('index', this.index);
  $li.click(func);
  parent.append($li);
};

Layer.prototype.setClip = function() {
  this.$element.css({
    '-webkit-clip-path': 'url(#' + this.clippingPath.node.id + ')',
    'clip-path': 'url(#' + this.clippingPath.node.id + ')'
  });
};

Layer.prototype.clip = function(clip) {
  this.clippingPath.add(clip);
};

Layer.prototype.clear = function() {
  this.clippingPath.clear();
};

module.exports = Layer;