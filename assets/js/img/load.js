module.exports = function(svg, url, callback) {
  svg.image(url).loaded(function(loader) {
    svg.size(loader.width, loader.height);
    svg.parent.size(loader.width, loader.height);
    if (callback) callback(svg)
  });
};