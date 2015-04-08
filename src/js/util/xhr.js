var Promise = require('promise');

module.exports = function(url) {

  // A small example of object
  var core = {

    // Method that performs the ajax request
    ajax: function(method, url, payload, args) {

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

        client.open(method, uri, true);

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

        if (payload) {
          client.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        }

        client.send(payload);
      })
    }
  }

  // Adapter pattern
  return {
    'get': function(args) {
      return core.ajax('GET', url, null, args);
    },
    'post': function(payload, args) {
      return core.ajax('POST', url, payload, args);
    },
    'put': function(payload, args) {
      return core.ajax('PUT', url, payload, args);
    },
    'delete': function(args) {
      return core.ajax('DELETE', url, null, args);
    }
  };
}