var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var Job = require('./job');
var Worker = require('./worker');
var Server = require('./server');

var handlers = {
  'client': {
    'queue': {
      'add': function(sender, options, callback) {
        var dispatcher = this;
        var conditions = {
          'replicates': options.replicates
        };
        var id = dispatcher.manager.next_id();
        var job = new Job(id, options.platform, options.benchmark,
          options.browser, options.channel, options.install, options.load, options.device, conditions);
        async(function() {
          dispatcher.emit(Dispatcher.E_JOB, job);
        });
        callback({
          'id': job.id
        });
      }
    }
  },
  'worker': {
    'ready': function(sender, options, callback) {
      var dispatcher = this;
      var worker = dispatcher.manager.find_worker(sender);
      if(!worker) {
        var worker = new Worker(sender);
        async(function() {
          dispatcher.emit(Dispatcher.E_WORKER, worker);
        });
      } else {
        worker.ready();
      }
      worker.callback = callback;
    },
    'result': function(sender, options, callback) {
      console.log('result:', options);
      var dispatcher = this;
      var worker = dispatcher.manager.find_worker(options.worker);
      worker.task.complete(options.result);
      worker.ready();
      callback({});
    }
  }
};

function default_handler(sender, options, callback) {
  callback({'error': 'method not found: ' + options.method});
}

function Operation(dispatcher, message) {
  var operation = this;
  var handler = handlers;
  var options = message.data.options || {};
  var sender = message.data.sender || null;

  var method = message.data.method.split('.');
  for(var i = 0; i < method.length; ++i) {
    var key = method[i];
    handler = handler[key];
    if(undefined == handler) {
      break;
    }
  }

  if(!handler) {
    options = {method: message.data.method};
    handler = default_handler;
  }

  this.reply = message.reply;

  this.call = function call(context) {
    handler.call(context, sender, options, operation.reply);
  };

  message.on(Server.E_DISCONNECT, function() {
    console.error('worker %s disconnected', sender);
  });
}

function Dispatcher(manager) {
  var dispatcher = this;
  var queued_messages = [];
  var operations = [];

  function handle_next_queued_message() {
    var message = queued_messages.shift();
    var operation = new Operation(dispatcher, message);
    operation.call(dispatcher);
  }

  this.queue = function queue(message) {
    if(0 == queued_messages.length) {
      async(handle_next_queued_message);
    }

    queued_messages.push(message);
  }

  Object.defineProperty(this, 'manager', {
    'get': function() {
      return manager;
    }
  });
}

inherits(Dispatcher, EventEmitter);

Dispatcher.E_JOB = 'JOB';
Dispatcher.E_WORKER = 'WORKER';

module.exports = Dispatcher;