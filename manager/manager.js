var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
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
  var mgr_port = this.mgr_port_ = 9001;

  var mdns_browser = this.mdns_browser_ = new mdns.Browser('overwatch-wkr');
  mdns_browser.on(mdns.Browser.E_SERVICE_UP, function(svc) {
    console.log(svc);
  });

  var mdns_cli_ad = this.mdns_cli_ad_ = new mdns.Ad(cli_port, 'overwatch-cli');
  var mdns_mgr_ad = this.mdns_mgr_ad_ = new mdns.Ad(mgr_port, 'overwatch-mgr');

  var cli_sock = this.cli_sock_ = zmq.socket('rep');
  var mgr_sock = this.mgr_sock_ = zmq.socket('pull');

  this.cli_sock_handler = function cli_sock_handler(msg) {
    var sock = this;
    function reply(msg) {
      sock.send(JSON.stringify(msg));
    }

    msg = JSON.parse(msg);
    reply(msg);
  };

  this.mgr_sock_handler = function mgr_sock_handler(msg) {

  };
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';

Manager.prototype.start = function start() {
  this.cli_sock_.bindSync('tcp://*:' + this.cli_port_);
  this.cli_sock_.on('message', this.cli_sock_handler);

  this.mgr_sock_.bindSync('tcp://*:' + this.mgr_port_);
  this.mgr_sock_.on('message', this.mgr_sock_handler);

  this.mdns_cli_ad_.start();
  this.mdns_mgr_ad_.start();
  this.mdns_browser_.start();

  setTimeout(function() {
    this.emit(Manager.E_READY);
  }.bind(this), 0);
};

Manager.prototype.stop = function stop() {
  this.mdns_cli_ad_.stop();
  this.mdns_mgr_ad_.stop();
  this.mdns_browser_.stop();

  this.cli_sock_.close();
  this.mgr_sock_.close();
};

module.exports = Manager;