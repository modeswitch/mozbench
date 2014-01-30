var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var Discover = require('../common/discover');

var uuid = require('uuid');
var fs = require('fs');
var async = require('../common/async');
var Client = require('./client');
var Dispatcher = require('./dispatcher');
var Downloader = require('./downloader');

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

  var downloader = new Downloader('/tmp');

  Object.defineProperty(this, 'downloader', {
    'get': function() {
      return downloader;
    }
  });

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
      beacon.search();
    }, 5000);
  });

  var beacon = new Discover.Client('mozbench');
  beacon.on(Discover.Client.E_ANNOUNCE, function(host, port) {
    console.log('connecting to manager: %s %s', host, port);
    client.ready(host, port);
  });

  this.start = function start() {
    beacon.search();

    async(function() {
      worker.emit(Worker.E_READY);
    });
  };

  this.stop = function stop() {

  };

  this.send = function send(message) {
    sock.send(JSON.stringify(message));
  };
}

inherits(Worker, EventEmitter);

Worker.E_READY = 'READY';

module.exports = Worker;