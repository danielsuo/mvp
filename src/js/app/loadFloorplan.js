// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

var input = document.getElementById('file');
input.onchange = function() {
  var file = input.files[0];
  var url = window.URL.createObjectURL(file);

  if (file.type.indexOf('svg') > -1) {
    require('./svg/load')(data.floorplan, url);
  } else if (file.type.indexOf('image') > -1) {
    require('./img/load')(data.floorplan, url);
  } else if (file.type.indexOf('pdf') > -1) {
    require('./pdf/load')(data.floorplan, url);
  }

  // TOOD: Remove
  setTimeout(function() {
    console.log(data.floorplan);
  }, 2000);
};