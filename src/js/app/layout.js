// NOTE: We use data as a global object. To fix eventually.
var _ = require('../util/lodash');
var XHR = require('../util/xhr');

var Layout = function(name, state, preset) {
  this.name = name;
  this.id = encodeURI(this.name);
  this.state = state;
  this.preset = preset === undefined ? false : preset;
};

Layout.prototype.createButton = function(parent, func) {
  var $li = $(document.createElement('li'));
  $li.html(this.name).data('index', this.index);
  $li.click(func);
  parent.append($li);
};

// TODO: do something if this fails to save in db
Layout.create = function(name, layout) {
  var result = new Layout(name, layout);

  $.post('/app/' + data.id + '/new', result.serialize())
    .done(function(data) {
      console.log(data);
    });

  return result;
};

Layout.prototype.update = function() {
  $.put('/app/' + data.id + '/testfit/' + this.id, this.serialize())
    .done(function(data) {
      console.log(data);
    });
};

Layout.prototype.delete = function() {
  if (!this.preset) {
    XHR('/app/' + data.id + '/testfit/' + this.id).delete()
      .then(function() {
        console.log('deleted');
      });
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

// var Layer = function(layer, index) {
//   this.index = index;
//   this.id = layer.id;
//   this.name = layer.name;

//   this.file_path = data.config.directory + this.id + '.svg';
//   this.disabled = ['shell', 'static'].indexOf(this.id) > -1;
//   this.noButton = ['static'].indexOf(this.id) > -1;

//   this.clippingPath = data.clip();
//   this.seats = layer.seats;

//   // TODO: need seats

//   return this;
// };

// Layer.prototype.draw = function() {
//   this.element = document.createElement('div');
//   this.element.id = this.id;

//   document.getElementById('svg').appendChild(this.element);

//   this.$element = $('#' + this.id);
//   this.$element.css({
//     'background-image': 'url(' + this.file_path + ')'
//   });

//   if (!this.disabled) {
//     this.setClip();
//   }
// };

// Layer.prototype.createButton = function(parent, func) {
//   if (!this.noButton) {
//     var $li = $(document.createElement('li'));
//     $li.html(this.name).data('index', this.index);
//     $li.click(func);
//     parent.append($li);
//   }
// };

// Layer.prototype.setClip = function() {
//   this.$element.css({
//     '-webkit-clip-path': 'url(#' + this.clippingPath.node.id + ')',
//     'clip-path': 'url(#' + this.clippingPath.node.id + ')'
//   });
// };

// Layer.prototype.clip = function(clip) {
//   this.clippingPath.add(clip);
// };

// Layer.prototype.clear = function() {
//   this.clippingPath.clear();
// };

// Layer.prototype.getNumSeats = function(id) {
//   if (parseInt(id) < this.seats.length) {
//     return this.seats[id];
//   } else {
//     if (this.index === 3) // Office
//       return 1;
//   }
//   return 0;
// };

// module.exports = Layer;