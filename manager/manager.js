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
  var manager = this;

  var cli_port = this.cli_port_ = 9000;
  var wkr_port = this.wkr_port_ = 9001;

  var mdns_cli_ad = this.mdns_cli_ad_ = new MdnsAd(cli_port, 'overwatch-cli');
  var mdns_wkr_ad = this.mdns_wkr_ad_ = new MdnsAd(wkr_port, 'overwatch-wkr');

  var cli_sock = this.cli_sock_ = zmq.socket('rep');
  var wkr_sock = this.wkr_sock_ = zmq.socket('pull');

  this.cli_sock_handler = function cli_sock_handler(msg) {
    var sock = this;
    function reply(msg) {
      sock.send(JSON.stringify(msg));
    }

    msg = JSON.parse(msg);
    reply(msg);
  };
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';

Manager.prototype.start = function start() {
  this.cli_sock_.bindSync('tcp://0.0.0.0:' + this.cli_port_);
  this.cli_sock_.on('message', this.cli_sock_handler);

  this.wkr_sock_.bindSync('tcp://0.0.0.0:' + this.wkr_port_);
  // this.wkr_sock_.on('message', this.handler);

  this.mdns_cli_ad_.start();
  this.mdns_wkr_ad_.start();

  setTimeout(function() {
    this.emit(Manager.E_READY);
  }.bind(this), 0);
};

Manager.prototype.stop = function stop() {
  this.mdns_cli_ad_.stop();
  this.mdns_wkr_ad_.stop();

  this.cli_sock_.close();
  this.wkr_sock_.close();
};

module.exports = Manager;