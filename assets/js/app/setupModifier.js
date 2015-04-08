// NOTE: Everything in this file is scratch space and has not been refactored
// into something reasonable yet.

data.modifier = {
  shift: false,
  ctrl: false,
  alt: false
};
data.mode = {};
data.mode.scale = {
  on: false,
  started: false
};
data.mode.trace = {
  on: false,
  started: false,
  startSegment: false
};

data.objects = data.nested();

SVG.on(window, 'keydown', function(event) {
  if (event.shiftKey) {
    data.modifier.shift = true;
  }
});

SVG.on(window, 'keyup', function(event) {
  // TODO: keyup not registered when prompt is open
  if (!event.shiftKey && data.modifier.shift) {
    data.modifier.shift = false;
  }
})