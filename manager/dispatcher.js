var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var Job = require('./job');

var handlers = {
  'queue': {
    'add': function(sender, options, callback) {
      var dispatcher = this;
      var conditions = {
        'replicates': options.replicates
      };
      var job = new Job(dispatcher.manager.next_id(), options.platform, options.benchmark,
        options.browser, options.channel, options.install, options.load, options.device, conditions);
      async(function() {
        dispatcher.emit(Dispatcher.E_JOB, job);
      });
      callback({
        'return': job.id()
      });
    }
  },
  'worker': {
    'ready': function(sender, options, callback) {
      var dispatcher = this;
      var worker_id = options.sender;
      var worker = dispatcher.manager.find_worker(worker_id);
      if(!worker) {
        var worker = new Worker(dispatcher.manager.next_id());
        async(function() {
          dispatcher.emit(Dispatcher.E_WORKER, worker);
        });
      } else {
        async(function() {
          worker.ready();
        });
      }
      worker.callback = callback;
    }
  }
};

function default_handler(options, callback) {
  callback({'error': 'method not found: ' + options.method});
}

function Operation(dispatcher, message) {
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
    handler = default_handler;
  }

  this.reply = message.reply;

  this.call = function call(context) {
    handler.call(context, sender, options, operation.reply);
  };
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
    if(0 == queue.length) {
      async(handle_next_queued_message);
    }

    queued_messages.push(message);
  }

  this.manager = function manager() {
    return manager;
  };
}

inherits(Dispatcher, EventEmitter);

Dispatcher.E_JOB = 'JOB';
Dispatcher.E_WORKER = 'WORKER';

module.exports = Dispatcher;