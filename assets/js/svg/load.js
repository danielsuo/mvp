var XHR = require('../util/xhr');
var SVG = require('svg.js');
require('./parser');
require('./import');

module.exports = function(svg, url) {
  return XHR.get(url).then(function(response) {
    var raw = svg.svg(response).roots()[0];
    var viewbox = raw.viewbox;
    var rect = svg.rect(viewbox.width, viewbox.height);

    svg.add(rect).add(raw);

    return svg;
  });
};