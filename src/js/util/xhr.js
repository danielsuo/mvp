var Promise = require('promise');

// module.exports = {
//   get: function(url) {
//     return new Promise(function(resolve, reject) {
//       var req = new XMLHttpRequest();
//       req.open('GET', url);

//       req.onload = function() {
//         if (req.status == 200) {
//           resolve(req.response);
//         } else {
//           reject(Error(req.statusText));
//         }
//       };

//       req.onerror = function() {
//         reject(Error("Network Error"));
//       };

//       req.send();
//     });
//   }
// };

module.exports = function(url) {

  // A small example of object
  var core = {

    // Method that performs the ajax request
    ajax: function(method, url, data, args) {

      // Establishing a promise in return
      return new Promise(function(resolve, reject) {

        // Instantiates the XMLHttpRequest
        var client = new XMLHttpRequest();
        var uri = url;

        if (args && (method === 'POST' || method === 'PUT')) {
          uri += '?'
          for (key in args) {
            if (args.hasOwnProperty(key)) {
              uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]) + '&';
            }
          }
        }

        client.open(method, uri);

        client.onload = function() {
          if (this.status == 200) {
            // Performs the function "resolve" when this.status is equal to 200
            resolve(this.response);
          } else {
            // Performs the function "reject" when this.status is different than 200
            reject(this.statusText);
          }
        };

        client.onerror = function() {
          reject(this.statusText);
        }

        client.send(data);
      })
    }
  }

  // Adapter pattern
  return {
    'get': function(args) {
      return core.ajax('GET', url, data, args);
    },
    'post': function(data, args) {
      return core.ajax('POST', url, data, args);
    },
    'put': function(data, args) {
      return core.ajax('PUT', url, data, args);
    },
    'delete': function(args) {
      return core.ajax('DELETE', url, data, args);
    }
  };
}