var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');

function Worker(id) {
  this.id = id;
  this.device = 'x220-linux';
  this.callback = null;
  this.task = null;
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