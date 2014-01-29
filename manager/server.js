var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var async = require('../common/async');

function Message(response, data) {
  var message = this;
  this.data = data;

  this.reply = function reply(message) {
    message = JSON.stringify(message);

    response.setHeader('Content-Type', 'application/json');
    response.writeHead(200);
    response.write(message);
    response.end();
  };
/*
  response.on('close', function() {
    async(function() {
      message.emit(Message.E_DISCONNECT);
    });
  });
*/
}

inherits(Server, EventEmitter);

function Server(port) {
  var server = this;

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
        server.emit(Server.E_CALL, message);
      });
    });
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
Server.E_DISCONNECT = 'DISCONNECT';

module.exports = Server;