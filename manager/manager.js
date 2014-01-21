var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');
var async = require('../common/async');

var commands = {
  'client': {
    'debug': {
      'test': function(options, callback) {
        callback({'return': 'OK'});
      }
    }
  }
}

function dispatch(message, manager, callback) {
  var method = message['method'].split('.');
  var obj = commands;
  for(var i = 0; i < method.length; ++i) {
    var key = method[i];
    obj = obj[key];
    if(undefined == obj) {
      return callback({'error': 'dispatch failed'});
    }
  }
  obj.call(manager, message['options'], callback);
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

  var cli_queued = [];

  function handle_cli_message(data) {
    msg = JSON.parse(data.toString());
    cli_queued.push(msg);
    if(cli_queued.length == 1) {
      async(handle_next_cli_queued_message);
    }
  }

  function handle_next_cli_queued_message() {
    if(cli_queued.length) {
      var msg = cli_queued.shift();
      dispatch(msg, manager, cli_reply);
      async(handle_next_cli_queued_message);
    }
  }

  function cli_reply(message) {
    cli_sock.send(JSON.stringify(message));
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

    async(function() {
      manager.emit(Manager.E_READY);
    });
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