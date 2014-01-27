var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');
var async = require('../common/async');
var uuid = require('uuid');
var _ = require('lodash');

var commands = {
  'client': {
    'debug': {
      'test': function() {
        this.reply({'return': {
          'workers': Object.keys(this.manager.workers),
          'jobs': Object.keys(this.manager.jobs)
        }});
      }
    },
    'queue': {
      'add': function(options) {
        var job = new Job(options.platform, options.benchmark, options.browser,
          options.channel, options.install, options.load, options.device, options.replicates);
        this.manager.add_job(job.id, job);
        this.reply({'return': job.id});
      },
      'remove': function(options) {
        var id = options.job;
        this.manager.remove_job(id);
        this.reply();
      },
      'info': function() {
        console.log(this.manager.jobs);
        this.reply();
      }
    },
    'worker': {
      'info': function() {
        console.log(this.manager.workers);
        this.reply();
      }
    }
  },
  'worker': {
    'ready': function() {
      var worker;
      if(!this.manager.has_worker(this.envelope)) {
        worker = new Worker(this.envelope);
        this.manager.add_worker(this.envelope, worker);
      } else {
        worker = this.manager.get_worker(this.envelope);
      }
      worker.operation = this;
      worker.available();
    },
    'result': function() {
      console.log(this.options);
      this.reply({
        'method': 'worker.complete'
      });
    }
  }
}

var Worker = require('./worker');

function Job(platform, benchmark, browser, channel, install, load, device, replicates) {
  var job = this;
  this.id = uuid.v4();
  this.platform = platform;
  this.benchmark = benchmark;
  this.browser = browser;
  this.channel = channel;
  this.install = install;
  this.load = load;
  this.device = device;

  // task queues
  this.waiting = {}; // waiting for a worker
  this.pending = {}; // assigned to a worker, awaiting result
  this.completed = {}; // result received

  var i, task;
  for(i = 0; i < replicates; ++ i) {
    task = new Task(this, i);

    task.on(Task.E_COMPLETE, function() {
      var id = task.id;
      delete job.pending[id];
      job.completed[id] = task;
      if(!_.size(job.waiting) && _.size(job.pending)) {
        job.complete();
      }
    });

    task.on(Task.E_ABORT, function() {
      var id = task.id;
      delete job.pending[id];
      job.waiting[id] = task;
      job.available();
    });

    this.waiting[i] = task;
  }

  job.available();
}

inherits(Job, EventEmitter);

Job.E_AVAILABLE = 'AVAILABLE';
Job.E_COMPLETE = 'COMPLETE';

Job.prototype.available = function available() {
  var job = this;
  async(function() {
    job.emit(Job.E_AVAILABLE);
  });
};

Job.prototype.complete = function complete() {
  var job = this;
  async(function() {
    job.emit(Job.E_COMPLETE);
  });
};

Job.prototype.n_waiting = function n_waiting() {
  return _.size(this.waiting);
};

Job.prototype.get_waiting_task = function get_waiting_task() {
  if(!_.size(this.waiting)) {
    return null;
  }
  var task = _.sample(this.waiting);
  var id = task.id;

  delete this.waiting[id];
  this.pending[id] = task;

  return task;
};

function Task(job, id) {
  this.id = id;
  this.job = job;
  this.result = null;
}

inherits(Task, EventEmitter);

Task.E_COMPLETE = 'COMPLETE';
Task.E_ABORT = 'ABORT';

Task.prototype.complete = function complete(result) {
  var task = this;

  task.result = result;

  async(function() {
    task.emit(Task.E_COMPLETE);
  });
};

Task.prototype.abort = function abort() {
  var task = this;

  async(function() {
    task.emit(Task.E_ABORT);
  });
};

function Operation(manager, handler, envelope, method, options) {
  this.manager = manager;
  this.handler = handler;
  this.envelope = envelope;
  this.options = options || {};

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
  message = message || {};
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
    sock.monitor();
    sock.bindSync(addr);
    sock.on('message', queue_message);
  };

  this.stop = function stop() {
    sock.unmonitor();
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

  function find_workers_for_job(job, limit) {
    var device = job.device;
    var possible_workers = workers_by_device[device];
    if(_.size(possible_workers)) {
      return _.sample(possible_workers, limit);
    } else {
      return [];
    }
  }

  function find_job_for_worker(worker) {
    var device = worker.device;
    var possible_jobs = jobs_by_device[device];
    var job = _.find(possible_jobs, function(job) {
      return job.n_waiting();
    });
    return job;
  }

  var workers = {};
  var workers_by_device = {};
  var available_workers = {};
  this.workers = workers;

  this.has_worker = function has_worker(key) {
    return workers.hasOwnProperty(key);
  };

  this.get_worker = function get_worker(key) {
    return workers[key];
  };

  this.add_worker = function add_worker(key, worker) {
    console.log('adding worker %s', worker.id);
    workers[key] = worker;
    var device = worker.device;
    if(!workers_by_device.hasOwnProperty(device)) {
      workers_by_device[device] = {};
    }
    workers_by_device[device][key] = worker;

    worker.on(Worker.E_AVAILABLE, function() {
      console.log('worker %s available', worker.id);
      var job = find_job_for_worker(worker);
      if(job && job.n_waiting()) {
        console.log('assigning %s to %s', job.id, worker.id);
        var task = job.get_waiting_task();
        if(task) {
          worker.operation.reply({
            method: 'worker.run',
            options: {
              job: job.id,
              task: task.id,
              install: job.install,
              load: job.load
            }
          });
        }
      } else {
        console.log('no job for worker %s', worker.id);
        available_workers[worker.id] = worker;
      }
    });
  };

  this.remove_worker = function remove_worker(key) {
    var worker = workers[key];
    if(worker) {
      var device = worker.device;
      delete workers[key];
      delete workers_by_device[device][key];
      delete available_workers[key];
      worker.removeAllListeners();
    }
  };

  var jobs = {};
  var jobs_by_device = {};
  this.jobs = jobs;

  this.has_job = function has_job(key) {
    return jobs.hasOwnProperty(key);
  };

  this.get_job = function get_job(key) {
    return jobs[key];
  };

  this.add_job = function add_job(key, job) {
    console.log('adding job %s', job.id);
    jobs[key] = job;
    var device = job.device;
    if(!jobs_by_device.hasOwnProperty(device)) {
      jobs_by_device[device] = {};
    }
    jobs_by_device[device][key] = job;

    job.on(Job.E_AVAILABLE, function() {
      console.log('job %s is available', job.id);
      var found_workers = find_workers_for_job(job, job.n_waiting());
      found_workers.forEach(function(worker) {
        console.log('assigning %s to %s', job.id, worker.id);
        var task = job.get_waiting_task();
        worker.operation.reply({
          method: 'worker.run',
          options: {
            job: job.id,
            task: task.id,
            install: job.install,
            load: job.load
          }
        });
      });
    });

    job.on(Job.E_COMPLETE, function() {
      console.log('job %s is complete', job.id);
      manager.remove_job(job.id);
    });
  };

  this.remove_job = function remove_job(key) {
    var job = jobs[key];
    if(job) {
      var device = job.device;
      delete jobs[key];
      delete jobs_by_device[device][key];
      job.removeAllListeners();
    }
  };
}

inherits(Manager, EventEmitter);

Manager.E_READY = 'READY';



module.exports = Manager;