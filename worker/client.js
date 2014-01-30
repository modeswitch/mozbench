var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var http = require('http');

function Message(host, port, data) {
  this.host = host;
  this.port = port;
  this.data = data;
}

function Client(worker_id) {
  var client = this;
  var cached_host;
  var cached_port;

  function make_request(host, port, message) {
    host = host || cached_host;
    port = port || cached_port;
    cached_host = host;
    cached_port = port;

    var opts = {
      host: host,
      port: port,
      method: 'post'
    };
    var req = http.request(opts, function(res) {
      var data = '';
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(chunk) {
        if(chunk) {
          data += chunk;
        }

        var json = JSON.parse(data);
        var message = new Message(host, port, json);
        async(function() {
          client.emit(Client.E_TASK, message);
        });
      });
    });
    req.setHeader('Content-Type', 'application/json');
    req.write(JSON.stringify(message));
    req.end();

    return req;
  }

  this.ready = function ready(host, port) {
    var req = make_request(host, port, {
      sender: worker_id,
      method: 'worker.ready'
    });
    req.on('close', function() {
      client.emit(Client.E_DISCONNECT);
    });
    req.on('error', function(err) {
      console.error(err);
    });
  };
}

inherits(Client, EventEmitter);

Client.E_TASK = 'TASK';
Client.E_DISCONNECT = 'DISCONNECT';

module.exports = Client;