var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');

function Worker(id) {
  this.id = id;
  this.device = 'x220-linux';
  this.operation = null;
  this.task = null;
}

inherits(Worker, EventEmitter);

Worker.E_AVAILABLE = 'AVAILABLE';

Worker.prototype.available = function available() {
  var worker = this;

  async(function() {
    worker.emit(Worker.E_AVAILABLE);
  });
};

module.exports = Worker;