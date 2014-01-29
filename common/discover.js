var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var Polo = require('polo');
var async = require('./async');

function Server(name, port) {
  var polo = Polo();
  polo.put({
    name: name,
    port: port
  });
}

function Client(name) {
  var client = this;

  this.search = function search() {
    var polo = Polo();
    polo.on('up', function(found, service) {
      if(found == name) {
        client.emit(Client.E_ANNOUNCE, service.host, service.port);
      }
    });
  }
}

inherits(Client, EventEmitter);

Client.E_ANNOUNCE = 'ANNOUNCE';

module.exports = {
  Server: Server,
  Client: Client
}