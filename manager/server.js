var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var http = require('http');

function Message(response, data) {
  this.data = data;

  this.reply = function reply(message) {
    message = JSON.stringify(message);
    response.writeHead(200);
    response.setHeader('Content-Type', 'application/json');
    response.write(message);
    response.end();
  };
}

function Server(port) {
  function request_handler(req, res) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    });
    req.on('end', function(chunk) {
      if(chunk) {
        data += chunk;
      }

      var json = JSON.parse(data);
      var message = new Message(res, json);

      async(function() {
        this.emit(Server.E_CALL, message);
      }.bind(this));
    })
  }

  var http_server = http.createServer(request_handler);
  http_server.setTimeout(0);

  this.start = function start() {
    http_server.listen(port);
  };

  this.stop = function stop() {
    http_server.close();
  };
}

inherits(Server, EventEmitter);

Server.E_CALL = 'CALL';

module.exports = Server;