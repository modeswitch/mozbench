var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var _ = require('lodash');

var async = require('../common/async');
var Discover = require('../common/discover');
var Server = require('./server');
var Worker = require('./worker');
var Job = require('./job');
var Dispatcher = require('./dispatcher');

function Manager(port) {
  var manager = this;

  var beacon = new Discover.Server('mozbench', port);

  var jobs = {};
  var available_tasks = [];

  var workers = {};
  var available_workers = [];

  function find_task_for_worker(worker) {
    var found = _.find(available_tasks, function(task) {
      return task.job.device == worker.device;
    });
    // FIXME: inefficient
    if(found) {
      _.remove(available_tasks, function(task) {
        return task.id == found.id && task.job.id == found.job.id;
      });
    }
    return found;
  }

  function find_worker_for_task(task) {
    var found = _.find(available_workers, function(worker) {
      return worker.device == task.job.device;
    });
    // FIXME: inefficient
    if(found) {
      _.remove(available_workers, function(worker) {
        return worker.id == found.id;
      });
    }
    return found;
  }

  var dispatcher = new Dispatcher(manager);
  dispatcher.on(Dispatcher.E_JOB, function(job) {
    console.log('new job: %s', job.id);
    job.on(Job.E_TASK, function(task) {
      console.log('new task: %s', task.id);

      var worker = find_worker_for_task(task);
      if(!worker) {
        console.log('no worker found to run task %s for job %s', task.id, task.job.id);
        available_tasks.push(task);
      } else {
        console.log('running task %s for job %s on worker %s', task.id, task.job.id, worker.id);
        worker.run(task);
      }
    });
    job.on(Job.E_COMPLETE, function() {
      var job = this;
      delete jobs[job.id];
    });
    job.on(Job.E_ABORT, function() {
      var job = this;
      // FIXME: Remove all tasks for this job
      delete jobs[job.id];
    });
    jobs[job.id] = job;
  });
  dispatcher.on(Dispatcher.E_WORKER, function(worker) {
    console.log('new worker %s', worker.id);
    worker.on(Worker.E_READY, function() {
      if(worker.task && !worker.task.result) {
        console.log('worker %s is running a task', worker.id);
        return;
      } else if(worker.task && worker.task.result) {
        console.log('worker %s has finished running task %s for job', worker.id, worker.task.id, worker.task.job.id);
        worker.reset();
      } else {
        console.log('worker %s is ready', worker.id);
        var task = find_task_for_worker(worker);
        if(!task) {
          console.log('no task found for worker %s', worker.id);
          available_workers.push(worker);
        } else {
          console.log('running task %s for job %s on worker %s', task.id, task.job.id, worker.id);
          worker.run(task);
        }
      }
    });
    workers[worker.id] = worker;
    worker.ready();
  });

  var server = new Server(port);
  server.on(Server.E_CALL, function(message) {
    dispatcher.queue(message);
  });

  var next_id_ = 1;
  this.next_id = function next_id() {
    return next_id_ ++;
  };

  this.start = function start() {
    server.start();

    async(function() {
      manager.emit(Manager.E_READY);
    });
  }

  this.stop = function stop() {
    server.stop();
  };

  this.find_worker = function find_worker(id) {
    return workers[id];
  };

  this.find_job = function find_job(id) {
    return jobs[id];
  };
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';

module.exports = Manager;