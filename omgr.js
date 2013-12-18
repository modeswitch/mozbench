var fs = require('fs');
var zmq = require('zmq');
var mdns = require('mdns2');
var uuid = require('uuid');
var arp = require('arp');
var sqlite = require('sqlite3').verbose();

var Device = require('./device');
var Worker = require('./worker');

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
};

function load_workers() {
  Worker.fetch_all(db, function(err, workers) {
    WORKERS = workers;
    console.log(WORKERS);
    main();
  });
};

var wkr_svc_t = mdns.makeServiceType('overwatch', 'tcp', 'worker');
var browser = new mdns.Browser(wkr_svc_t);
browser.on('serviceUp', function(svc_inst) {
  wkr_name = svc_inst.name;
  wkr_host = svc_inst.host;
  var wkr_sock = zmq.socket('push');
  wkr_sock.connect('tcp://' + wkr_host + ':' + wkr_port);
  wkr_socks[wkr_name] = wkr_sock;
  if(!wkr_name in workers) {
    db.run('insert into workers (name) values(?)', [wkr_name], function(err) {
      if(err) return;
      workers[wkr_name] = null;
      console.log('worker online (unassigned)')
    });
  } else {
    console.log('%s worker online', [workers[wkr_name]]);
  }
});
browser.on('serviceDown', function(svc_inst) {
  delete workers[svc_inst.name];
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
      default:
        reply.call(this, {'error': 'command not implemented'});
    }
    /*
    if('show' == msg.method) {
      var args = msg.args.concat([reply.bind(this)]);
      do_show.apply(undefined, args);
    } else if('queue' == msg.method) {

    } else if('assign' == msg.method) {
      var args = msg.args.concat([reply.bind(this)]);
      do_assign.apply(undefined, args);
    }
    */
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
      callback({'error': 'command not implemented'});
  }
}

function cmd_devices_add(msg, callback) {
  if(msg.device in DEVICES) {
    return callback({'error': 'device exists'});
  }

  db.run('insert into devices(name, os, cpu, memory, gpu) values(?, ?, ?, ?, ?)',
    [msg.device, msg.os, msg.cpu, msg.memory, msg.gpu], function(err) {
      if(err) {
        return callback({'error': err});
      }

      DEVICES[msg.device] = [];
      console.log('devices add:', msg.device);
      console.log('devices:', DEVICES);
      return callback({});
    });
}

function cmd_devices_remove(msg, callback) {
  if(!(msg.device in DEVICES)) {
    return callback({'error': 'device does not exists'});
  }

  db.run('delete from devices where name=?',
    [msg.device], function(err) {
      if(err) {
        return callback({'error': err});
      }

      DEVICES[msg.device] = [];
      console.log('devices remove:', msg.device);
      console.log('devices:', DEVICES);
      return callback({});
    });
}

function cmd_workers_assign(msg, callback) {
  if(!msg.worker in WORKERS) {
    return callback({'error': 'worker does not exist'});
  }

  if(!msg.device in DEVICES) {
    return callback({'error': 'device does not exist'});
  }
}