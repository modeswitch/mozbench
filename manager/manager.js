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

  var cli_port = 9000;
  var cli_addr = 'tcp://*:' + cli_port;
  var mgr_port = 9001;
  var mgr_addr = 'tcp://*:' + mgr_port;

  var mdns_cli_ad = new mdns.Ad(cli_port, 'overwatch-cli');
  var mdns_mgr_ad = new mdns.Ad(mgr_port, 'overwatch-mgr');

  var cli_sock = zmq.socket('rep');
  var mgr_sock = zmq.socket('router');
  mgr_sock.id = 'manager';

  function handle_cli_message(data) {
    function reply(msg) {
      cli_sock.send(JSON.stringify(msg));
    }

    msg = JSON.parse(data.toString());
    reply(msg);
  }

  function handle_mgr_message(envelope, delimiter, data) {
    console.log(envelope.toString(), data.toString());
  }

  this.start = function start() {
    cli_sock.bindSync(cli_addr);
    cli_sock.on('message', handle_cli_message);

    mgr_sock.bindSync(mgr_addr);
    mgr_sock.on('message', handle_mgr_message);

    mdns_cli_ad.start();
    mdns_mgr_ad.start();

    setTimeout(function() {
      manager.emit(Manager.E_READY);
    }, 0);
  }

  this.stop = function stop() {
    mdns_cli_ad.stop();
    mdns_mgr_ad.stop();

    cli_sock.close();
    mgr_sock.close();
  };
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';



module.exports = Manager;