var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var _ = require('lodash');

function Job(id, platform, benchmark, browser, channel, install, load, device, conditions) {
  var job = this;
  var timestamp = Math.round(+new Date()/1000);
  var tasks = {};
  var completed_tasks = {};
  var aborted = false;

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
    }
  } else {
    async(function() {
      job.emit(Job.E_COMPLETE);
    });
  }

  this.abort = function abort() {
    aborted = true;
    _.forEach(tasks, function(task) {
      task.abort();
    });
  };

  this.id = function id() {
    return id;
  };

  this.platform = function platform() {
    return platform;
  };

  this.benchmark = function benchmark() {
    return benchmark;
  };

  this.channel = function channel() {
    return channel;
  };

  this.install = function install() {
    return install;
  };

  this.load = function load() {
    return load;
  };

  this.device = function device() {
    return device;
  };

  this.timestamp = function timestamp() {
    return timestamp;
  };
}

inherits(Job, EventEmitter);

Job.E_TASK = 'TASK';
Job.E_COMPLETE = 'COMPLETE';
Job.E_ABORT = 'ABORT';

