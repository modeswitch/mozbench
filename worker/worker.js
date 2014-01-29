var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var uuid = require('uuid');
var fs = require('fs');
var async = require('../common/async');
var Client = require('./client');
var Dispatcher = require('./dispatcher');

function Worker() {
  var worker = this;
  var id;
  var req;

  this.task = null;

  if(!fs.existsSync('wkr_id.json')) {
    id = uuid.v4();
    fs.writeFileSync('wkr_id.json', id);
  } else {
    id = fs.readFileSync('wkr_id.json').toString();
  }

  var dispatcher = new Dispatcher(worker);

  var client = new Client(id);
  client.on(Client.E_TASK, function(message) {
    dispatcher.run(message, function() {
      client.ready();
    });
  });
  client.on(Client.E_DISCONNECT, function() {
    console.log('disconnected');
    setTimeout(function() {
      mdns_browser.search();
    }, 5000);
  });

  var mdns_browser = new mdns.Browser('overwatch');
  mdns_browser.on(mdns.Browser.E_MANAGER, function(host, port) {
    client.ready(host, port);
  });

  this.start = function start() {
    mdns_browser.search();

    async(function() {
      worker.emit(Worker.E_READY);
    });
  };

  this.stop = function stop() {
    mdns_browser.stop();
  };

  this.send = function send(message) {
    sock.send(JSON.stringify(message));
  };
}

inherits(Worker, EventEmitter);

Worker.E_READY = 'READY';

module.exports = Worker;