var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');
var uuid = require('uuid');
var fs = require('fs');
var async = require('../common/async');

function Worker() {
  var worker = this;
  var mgr_addr;
  var sock;
  var id;

  if(!fs.existsSync('wkr_id.json')) {
    id = uuid.v4();
    fs.writeFileSync('wkr_id.json', wkr_id);
  } else {
    id = fs.readFileSync('wkr_id.json').toString();
  }
  id += ':' + uuid.v4();

  sock = zmq.socket('req');
  sock.identity = id;

  function handle_message(data) {
    console.log(data);
  }

  var mdns_browser = new mdns.Browser('overwatch-mgr');
  mdns_browser.on(mdns.Browser.E_SERVICE_UP, function(svc) {
    mgr_addr = 'tcp://' + svc.addresses[0] + ':' + svc.port;
    sock.connect(mgr_addr);
    sock.on('message', handle_message);
    sock.send('READY');
  });

  this.start = function start() {
    mdns_browser.start();

    async(function() {
      worker.emit(Worker.E_READY);
    });
  };

  this.stop = function stop() {
    mdns_browser.stop();
  };
}

inherits(Worker, EventEmitter);

Worker.E_READY = 'READY';

module.exports = Worker;