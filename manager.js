var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('mdns2');
var zmq = require('zmq');

function MdnsAd(port, name) {
  var svc_t = {
    'name': name,
    'protocol': 'tcp'
  };
  var ad = mdns.createAdvertisement(svc_t, port);

  this.start = function() {
    ad.start();
  }

  this.stop = function() {
    ad.stop();
  }
}

function Manager() {
  var that = this;

  var cli_port = 9000;
  var wkr_port = 9001;

  var mdns_cli_ad = new MdnsAd(cli_port, 'overwatch-cli');
  var mdns_wkr_ad = new MdnsAd(wkr_port, 'overwatch-wkr');

  var cli_sock = zmq.socket('rep');
  var wkr_sock = zmq.socket('pull');

  this.mdns_cli_ad_ = mdns_cli_ad;
  this.mdns_wkr_ad_ = mdns_wkr_ad;
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';

Manager.prototype.start = function start() {
  this.mdns_cli_ad_.start();
  this.mdns_wkr_ad_.start();

  setTimeout(function() {
    this.emit(Manager.E_READY);
  }.bind(this), 0);
};

Manager.prototype.stop = function stop() {
  this.mdns_cli_ad_.stop();
  this.mdns_wkr_ad_.stop();
};

module.exports = Manager;