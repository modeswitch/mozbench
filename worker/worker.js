var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');

function Worker() {
  var worker = this;

  var wkr_port = this.wkr_port_ = 9002;

  var mdns_browser = this.mdns_browser_ = new mdns.Browser('overwatch-mgr');
  mdns_browser.on(mdns.Browser.E_SERVICE_UP, function(svc) {
    console.log(svc);
  });

  var mdns_wkr_ad = this.mdns_wkr_ad_ = new mdns.Ad(wkr_port, 'overwatch-wkr');

  var wkr_sock = this.wkr_sock_ = zmq.socket('pull');
  this.wkr_sock_handler = function wkr_sock_handler(msg) {

  };
}

inherits(Worker, EventEmitter);

Worker.prototype.start = function start() {
  this.mdns_browser_.start();
  this.mdns_wkr_ad_.start();

  this.wkr_sock_.bindSync('tcp://*:' + this.wkr_port_);
  this.wkr_sock_.on('message', this.wkr_sock_handler);
}

Worker.prototype.stop = function stop() {
  this.mdns_browser_.stop();
  this.mdns_wkr_ad_.stop();
}

module.exports = Worker;