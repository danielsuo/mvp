var XHR = require('../util/xhr');
require('./parser');
require('./import');

module.exports = function(svg, url, callback) {
  XHR.get(url, function(req) {
    var raw = svg.svg(req.target.response).roots()[0];
    var viewbox = raw.viewbox;

    var rect = svg.rect(viewbox.width, viewbox.height);
    rect.opacity(0.5);

    svg.add(rect).add(raw);

    if (callback) callback(svg)
  });
};