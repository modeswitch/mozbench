var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var http = require('http');

var async = require('../common/async');
var mdns = require('../common/mdns-beacon');
var Server = require('./server');
var Worker = require('./worker');
var Job = require('./job');
var Dispatcher = require('./dispatcher');

function Manager(port) {
  var manager = this;

  var mdns_ad = new mdns.Ad(port, 'overwatch');

  var jobs = {};
  var workers = {};

  var dispatcher = new Dispatcher(manager);
  dispatcher.on(Dispatcher.E_JOB, function(job) {
    job.on(Job.E_TASK, function(task) {

    });
    job.on(Job.E_COMPLETE, function() {

    });
    job.on(Job.E_ABORT, function() {

    });
    jobs[job.id()] = job;
  });
  dispatcher.on(Dispatcher.E_WORKER, function(worker) {
    worker.on(Worker.E_READY, function() {

    });
    workers[worker.id()] = worker;
  });

  var server = new Server(port);
  server.on(Server.E_CALL, function(message) {
    dispatcher.queue(message);
  });

  var next_id = 1;
  this.next_id = function next_id() {
    return next_id ++;
  };

  this.start = function start() {
    server.start();

    async(function() {
      manager.emit(Manager.E_READY);
    });
  }

  this.stop = function stop() {
    server.stop();
    mdns_ad.stop();
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