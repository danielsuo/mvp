// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

// SVG library
var SVG = require('./svg');
require('./ixn/zoom');
require('./ixn/pan');

// Pubsub library
var radio = require('radio');

// Promise library
var Promise = require('promise');

// Application modules
var app = require('./app');
var path = require('./util/path');
var XHR = require('./util/xhr');

// Utilities
var histogram = require('./util/histogram');

window.APP_NAME = 'protofit';

var draw = SVG(APP_NAME);
var data = draw.nested();

// Grab URL query parameters into object
data.params = require('./util/getQueryParameters')();
data.dir = ['.', 'data', data.params.client, data.params.project].join('/');

data[APP_NAME] = document.getElementById(APP_NAME);
data.panel = document.getElementById('panel');
data.info = document.getElementById('info');

data.enableZoom(data[APP_NAME]);
data.enablePan(data[APP_NAME]);

data.cells = app.Cells;
data.selected = [];

XHR.get(data.dir + '/config.json').then(function(response) {
  var config = JSON.parse(response);
  data.config = config;

  for (var i in config.layers) {
    var layer = config.layers[i];
    layer.url = data.dir + '/' + layer.name + '.svg';

    layer.svg = data.nested();
    layer.clipCells = [];

    layer.mask = data.path();
    layer.mask = path.fromRect(layer.mask, 0, 0, window.innerWidth, window.innerHeight, true);
    layer.mask = path.fromRect(layer.mask, 0, 0, window.innerWidth, window.innerHeight, false);

    layer.svg.clipWith(layer.mask);
  }

  data.layouts = document.createElement('div');
  data.layouts.id = 'layouts';
  data.panel.appendChild(data.layouts);

  data.layouts.innerHTML += '<ul>';
  for (var i in config.layouts) {
    data.layouts.innerHTML += '<li id=layout-' + config.layouts[i].id + '>' + config.layouts[i].name + '</li>'
  }
  data.layouts.innerHTML += '</ul>';
}).then(function() {
  var numLoaded = 0;

  return Promise.all(data.config.layers.map(function(layer) {
    return SVG.load(layer.svg, layer.url).then(function(svg) {
      numLoaded += 1;
      data.info.innerHTML = ['Finished loading', numLoaded, 'of', data.config.layers.length, 'loaded'].join(' ');
    }, function(error) {
      console.log(error)
    })
  }));
}).then(function() {
  data.info.innerHTML = 'Loading complete!';
  data.floorplan = data.nested();

  return data.cells.load(data.floorplan, data.dir + '/cells.svg').then(function() {
    data.cells.reset();
  })
}).then(function() {
  radio('cell-clicked').subscribe(function(i) {
    data.selected.push(i);

    data.cells.paths[i].attr({
      stroke: '#f0f'
    });

    data.info.innerHTML = histogram(data.cells.state, data.config.layers.length + 1).join(', ');
  });

  for (var i in data.config.layouts) {
    var layout = document.getElementById('layout-' + data.config.layouts[i].id);
    (function(layoutId, layoutIndex) {
      layout.addEventListener('click', function(event) {
        console.log(layoutId)
        for (var j in data.config.layers) {
          data.config.layers[j].clipCells = [];
          data.config.layers[j].mask = data.path();
          data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, true);
          data.config.layers[j].mask = path.fromRect(data.config.layers[j].mask, 0, 0, window.innerWidth, window.innerHeight, false);
        }

        data.cells.state = data.config.layouts[layoutIndex].state;
        for (var j in data.cells.state) {
          var layer = data.cells.state[j] - 1;
          var cell = data.cells.coord[j];
          if (layer > -1) data.config.layers[layer].clipCells.push(cell);
        }

        for (var j in data.config.layers) {
          for (var k in data.config.layers[j].clipCells) {
            data.config.layers[j].mask = path.fromPoints(data.config.layers[j].mask, data.config.layers[j].clipCells[k], true);
          }
          data.config.layers[j].svg.clipWith(data.config.layers[j].mask);
        }

        data.info.innerHTML = histogram(data.config.state, data.config.layers.length + 1).join(', ');
        data.cells.reset();
      }, false);
    })(data.config.layouts[i].id, i);
  }
}).catch(function(error) {
  console.log(error)
});