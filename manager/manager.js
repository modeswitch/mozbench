var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');
var async = require('../common/async');

var commands = {
  'client': {
    'debug': {
      'test': function() {
        console.log(this);
        this.reply({'return': {
          'workers': Object.keys(this.manager.workers)
        }});
      }
    }
  },
  'worker': {
    'ready': function() {
      if(!this.manager.has_worker(this.envelope)) {
        var worker = new Worker();
        worker.operation = this;
        this.manager.add_worker(this.envelope, worker);
      } else {
        var worker = this.manager.get_worker(this.envelope);
        worker.state = Worker.S_READY;
      }
    }
  }
}

function Worker() {
  this.state = Worker.S_READY;
  this.operation = null;
}

Worker.S_READY = 'READY';
Worker.S_WORKING = 'RUNNING';

function Operation(manager, handler, envelope, method, options) {
  this.manager = manager;
  this.handler = handler;
  this.envelope = envelope;
  this.options = options;

  var obj = commands;
  for(var i = 0; i < method.length; ++i) {
    var key = method[i];
    obj = obj[key];
    if(undefined == obj) {
      break;
    }
  }
  if(!obj) {
    this.method = function() {
      var result = {'error': 'method not found: ' + method.join('.')};
      this.reply(result);
    }
  } else {
    this.method = obj;
  }
}

Operation.prototype.call = function call() {
  this.method.call(this, this.options);
};

Operation.prototype.reply = function reply(message) {
  var envelope = new Buffer(this.envelope);
  var data = new Buffer(JSON.stringify(message));
  this.handler.send(envelope, data);
}

function Handler(manager, port) {
  var handler = this;
  var addr = 'tcp://*:' + port;
  var sock = zmq.socket('router');
  sock.id = 'manager';

  var queue = [];

  function queue_message(envelope, delimiter, data) {
    var envelope = envelope.toString();
    var message = JSON.parse(data.toString());
    var method = message['method'].split('.');
    var options = message['options'];

    var operation = new handler.Operation(envelope, method, options);
    queue.push(operation);

    if(queue.length == 1) {
      async(handle_next_message);
    }
  }

  function handle_next_message() {
    if(queue.length) {
      var operation = queue.shift();
      operation.call();
      async(handle_next_message);
    }
  }

  this.Operation = Operation.bind(undefined, manager, this);

  this.send = function send(envelope, data) {
    envelope = new Buffer(envelope);
    data = new Buffer(data);
    sock.send([envelope, '', data]);
  }

  this.start = function start() {
    sock.bindSync(addr);
    sock.on('message', queue_message);
  };

  this.stop = function stop() {
    sock.close();
  }
}

function Manager() {
  var manager = this;

  var port = 9000;
  var handler = new Handler(this, port);

  var mdns_ad = new mdns.Ad(port, 'overwatch');

  function handle_cli_message(data) {
    var message = JSON.parse(data.toString());
    cli_queued.push({
      'envelope': null,
      'message': message
    });
    if(cli_queued.length == 1) {
      async(handle_next_cli_queued_message);
    }
  }

  function handle_next_cli_queued_message() {
    if(cli_queued.length) {
      var queued = cli_queued.shift();
      dispatch(queued, manager, cli_reply);
      async(handle_next_cli_queued_message);
    }
  }

  this.start = function start() {
    handler.start();
    mdns_ad.start();

    async(function() {
      manager.emit(Manager.E_READY);
    });
  }

  this.stop = function stop() {
    mdns_ad.stop();
    handler.stop();
  };

  var workers = {};
  this.workers = workers;

  this.has_worker = function has_worker(key) {
    return workers.hasOwnProperty(key);
  };

  this.get_worker = function get_worker(key) {
    return workers[key];
  };

  this.add_worker = function add_worker(key, worker) {
    workers[key] = worker;
  };

  this.remove_worker = function remove_worker(key, worker) {
    delete workers[key];
  };
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';



module.exports = Manager;