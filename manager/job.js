var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var _ = require('lodash');
var Task = require('./task');

function Job(id, platform, benchmark, browser, channel, install, load, device, conditions) {
  id = String(id);
  var job = this;
  var timestamp = Math.round(+new Date()/1000);
  var tasks = {};
  var completed_tasks = {};
  var aborted = false;

  this.abort = function abort() {
    aborted = true;
    _.forEach(tasks, function(task) {
      task.abort();
    });
  };

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

  if(conditions.replicates) {
    var i, task;
    for(i = 0; i < conditions.replicates; ++ i) {
      task = new Task(i, job);
      tasks[task.id] = task;

      task.on(Task.E_COMPLETE, function() {
        if(aborted) return;
        completed_tasks[task.id] = task;
        if(_.size(completed_tasks) == conditions.replicates) {
          async(function() {
            job.emit(Job.E_COMPLETE);
          });
        }
      });

      task.on(Task.E_RETRY, function() {
        if(aborted) return;
        async(function() {
          job.emit(Job.E_TASK, task);
        });
      });

      async(function() {
        var new_task = this;
        async(function() {
          job.emit(Job.E_TASK, new_task);
        });
      }.bind(task));
    }
  } else {
    async(function() {
      job.emit(Job.E_COMPLETE);
    });
  }
}

inherits(Job, EventEmitter);

Job.E_TASK = 'TASK';
Job.E_COMPLETE = 'COMPLETE';
Job.E_ABORT = 'ABORT';

module.exports = Job;
