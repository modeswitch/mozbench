var fs = require('fs');
var zmq = require('zmq');
var mdns = require('mdns2');
var uuid = require('uuid');
var arp = require('arp');
var sqlite = require('sqlite3').verbose();
var _ = require('lodash');

var Device = require('./device');
var Worker = require('./worker');
var DevicePool = require('./device-pool');

var db = new sqlite.Database('overwatch.sqlite');

var DEVICES = {};
var WORKERS = {};
var wkr_port = 9001;
var wkr_socks = {};

function load_devices() {
  Device.fetch_all(db, function(err, devices) {
    DEVICES = devices;
    console.log(DEVICES);
    load_workers();
  });
}

function load_workers() {
  Worker.fetch_all(db, function(err, workers) {
    WORKERS = workers;
    console.log(WORKERS);
    load_device_pools();
  });
}

function load_device_pools() {
  DevicePool.fetch_all(db, function(err, device_pools) {
    if(err) throw err;
    DEVICE_POOLS = device_pools;
    console.log(DEVICE_POOLS);
    main();
  });
}

var wkr_svc_t = mdns.makeServiceType('overwatch', 'tcp', 'worker');
var browser = new mdns.Browser(wkr_svc_t);
browser.on('serviceUp', function(svc_inst) {
  var wkr_name = svc_inst.name;
  var wkr_host = svc_inst.host;
  var wkr_sock = zmq.socket('push');
  wkr_sock.connect('tcp://' + wkr_host + ':' + wkr_port);
  wkr_socks[wkr_name] = wkr_sock;
  if(!(wkr_name in WORKERS)) {
    var wkr = new Worker(wkr_name);
    wkr.flush(db, function(err) {
      if(err) return;
      WORKERS[wkr_name] = wkr;
      console.log('new worker online')
      console.log(WORKERS);
    });
  } else {
    console.log('worker online');
    console.log(WORKERS);
  }
  wkr_socks[wkr_name] = wkr_sock;
});
browser.on('serviceDown', function(svc_inst) {
  var wkr_name = svc_inst.name;
  wkr_socks[wkr_name].close();
  delete wkr_socks[wkr_name];
  console.log('worker offline');
  console.log(WORKERS);
});

// TODO: start web server

load_devices();
function main() {
  browser.start();

  function reply(msg) {
    this.send(JSON.stringify(msg));
  }

  var client_sock = zmq.socket('rep');
  client_sock.bindSync('tcp://0.0.0.0:9000');
  client_sock.on('message', function(msg) {
    msg = JSON.parse(msg);
    var command = msg.command;
    switch(command) {
      case 'devices':
        cmd_devices(msg, reply.bind(this));
        break;
      case 'workers':
        cmd_workers(msg, reply.bind(this));
        break;
      case 'queue':
        cmd_queue(msg, reply.bind(this));
        break;
      default:
        reply.call(this, {'error': 'not implemented'});
    }
  });
}

function cmd_devices(msg, callback) {
  switch(msg.subcommand) {
    case 'add':
      cmd_devices_add(msg, callback);
      break;
    case 'remove':
      cmd_devices_remove(msg, callback);
      break;
    default:
      callback({'error': 'not implemented'});
  }
}

function cmd_workers(msg, callback) {
  switch(msg.subcommand) {
    case 'add':
      cmd_workers_add(msg, callback);
      break;
    case 'remove':
      cmd_workers_remove(msg, callback);
      break;
    case 'info':
      cmd_workers_info(msg, callback);
      break;
    default:
      callback({'error': 'not implemented'})
  }
}

function cmd_devices_add(msg, callback) {
  if(_(DEVICES).has(msg.name)) {
    return callback({'error': 'device exists'});
  }

  var device = new Device(msg.name, msg.os, msg.cpu, msg.memory, msg.gpu);
  device.flush(db, function(err) {
    if(err) {
      return callback({'error': err});
    }

    DEVICES[msg.name] = device;
    console.log('devices add:', msg.name);
    console.log('devices:', DEVICES);
    return callback({});
  });
}

function cmd_devices_remove(msg, callback) {
  if(!_(DEVICES).has(msg.name)) {
    return callback({'error': 'device does not exists'});
  }

  // FIXME: purge device pool

  var device = DEVICES[msg.name];
  device.purge(db, function(err) {
    if(err) {
      return callback({'error': err});
    }

    delete DEVICES[msg.name];
    console.log('devices remove:', msg.name);
    console.log('devices:', DEVICES);
    return callback({});
  });
}

function cmd_workers_add(msg, callback) {
  if(!_(WORKERS).has(msg.worker)) {
    return callback({'error': 'worker does not exist'});
  }

  if(!_(DEVICES).has(msg.device)) {
    return callback({'error': 'device does not exist'});
  }

  if(!(msg.device in DEVICE_POOLS)) {
    var device_pool = new DevicePool(msg.device, [msg.worker]);
    device_pool.flush(db, function(err) {
      if(err) {
        return callback({'error': err});
      }

      DEVICE_POOLS[msg.device] = device_pool;
      return callback({});
    });
  } else if(!_(DEVICE_POOLS[msg.device].workers).contains(msg.worker)) {
    var device_pool = DEVICE_POOLS[msg.device];
    device_pool.workers.push(msg.worker);
    device_pool.flush(db, function(err) {
      if(err) {
        return callback({'error': err});
      }

      return callback({});
    });
  } else {
    return callback({'warning': 'worker already in device pool'});
  }
}