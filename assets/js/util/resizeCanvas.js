module.exports = function(canvas) {
  // Only change the size of the canvas if the size it's being displayed has
  // changed.
  var width = window.innerWidth;
  var height = window.innerHeight;

  if (canvas.width != width || canvas.height != height) {
    // Change the size of the canvas to match the size it's being displayed
    canvas.width = width;
    canvas.height = height;
  }
};