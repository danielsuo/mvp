// This might be in or pointed to in a config file

module.exports = {
  cells: [{
    x: 100,
    y: 100,
    width: 300,
    height: 300,

    // Assumes clockwise order
    segments: [{
      side: 't',
      start: 0,
      end: 300,
      internal: true,
      glass: true
    }, {
      side: 'b',
      start: 0,
      end: 300,
      internal: true,
      circulation: true
    }, {
      side: 'l',
      start: 0,
      end: 300,
      internal: true,
      circulation: true
    }, {
      side: 'r',
      start: 0,
      end: 300,
      external: true,
      windows: true
    }]
  }]
};

// module.exports = {
//   cells: [{
//     lines: [{
//       segments: [{
//         x1: 0,
//         y1: 0,
//         x2: 50,
//         y2: 0,
//         attr: {
//           internal: true,
//           glass: true,
//           circulation: false,
//           window: false
//         }
//       }, {
//         x1: 50,
//         y1: 0,
//         x2: 500,
//         y2: 0,
//         attr: {
//           internal: true,
//           glass: true,
//           circulation: true,
//           window: false
//         }
//       }]
//     }, {
//       segments: [{
//         x1: 500,
//         y1: 0,
//         x2: 500,
//         y2: 500,
//         attr: {
//           internal: true,
//           glass: false,
//           circulation: true,
//           window: false
//         }
//       }]
//     }, {
//       segments: [{
//         x1: 500,
//         y1: 500,
//         x2: 250,
//         y2: 500,
//         attr: {
//           internal: true,
//           glass: false,
//           circulation: false,
//           window: false
//         }
//       }, {
//         x1: 250,
//         y1: 500,
//         x2: 0,
//         y2: 500,
//         attr: {
//           internal: false,
//           glass: false,
//           circulation: false,
//           window: false
//         }
//       }]
//     }, {
//       segments: [{
//         x1: 0,
//         y1: 500,
//         x2: 0,
//         y2: 0,
//         attr: {
//           internal: false,
//           glass: false,
//           circulation: false,
//           window: true
//         }
//       }]
//     }]
//   }]
// };