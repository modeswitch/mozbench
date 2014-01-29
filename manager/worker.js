var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');

function Worker(id) {
  id = String(id);
  var device = 'x220-linux';
  this.callback = null;
  this.task = null;

  this.run = function run(task) {
    this.task = task;
    this.callback({
      'method': 'worker.run',
      'options': {
        worker: id,
        install: task.job.install,
        load: task.job.load
      }
    });
    this.callback = null;
  };

  this.reset = function reset() {
    this.task = null;
    this.callback({
      'method': 'worker.reset'
    });
    this.callback = null;
  }

  Object.defineProperty(this, 'id', {
    'get': function() {
      return id;
    }
  });

  Object.defineProperty(this, 'device', {
    'get': function() {
      return device;
    }
  });
}

inherits(Worker, EventEmitter);

Worker.E_READY = 'E_READY';

Worker.prototype.ready = function ready() {
  var worker = this;

  async(function() {
    worker.emit(Worker.E_READY);
  });
};

module.exports = Worker;