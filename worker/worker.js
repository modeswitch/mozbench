var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');
var uuid = require('uuid');
var fs = require('fs');
var async = require('../common/async');
var http = require('http');
var crypto = require('crypto');
var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var tmp_dir = '/tmp';
var install_dir = '/tmp';

function download_installer(url, callback) {
  var package_path = tmp_dir + '/' + path.basename(url);

  if(fs.existsSync(package_path)) {
    return callback(package_path);
  }

  var fd = fs.openSync(package_path, 'w+');

  var size = 0;
  var req = http.request(url, function(res) {
    res.on('data', function(chunk) {
      fs.appendFileSync(package_path, chunk, {encoding: 'binary'});
      size += chunk.length;
    });
    res.on('end', function(chunk) {
      if(chunk) {
        fs.appendFileSync(package_path, chunk, {encoding: 'binary'});
        size += chunk.length;
      }
      callback(package_path);
    });
    res.on('error', function(err) {
      console.error('error', err);
      fs.unlinkSync(package_path);
    });
  }).end();
}

function install_package(package_path, install_path, callback) {
  if(fs.existsSync(install_path)) {
    return callback(install_path);
  }

  if(!fs.existsSync(install_path)) {
    fs.mkdirSync(install_path);
  }

  var child;

  child = spawn('tar', ['xjf', package_path, '-C', install_path]);
  child.stdout.on('data', function(chunk) {
    process.stdout.write(chunk);
  });
  child.stderr.on('data', function(chunk) {
    process.stderr.write(chunk);
  });
  child.on('exit', function(code, signal) {
    if(0 == code) {
      create_profile();
    } else {
      fs.rmdirSync(install_path);
      // abort
    }
  });

  function create_profile() {
    var bin_path = install_path + '/firefox/firefox';
    var child = exec(bin_path + ' -CreateProfile benchmark');
    child.on('exit', function(code, signal) {
      callback(install_path);
    });
  }
}

var commands = {
  'worker': {
    'run': function(options) {
      var worker = this;
      worker.task = new Task(options);

      download_installer(options.install, do_install);

      function do_install(package_path) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(options.install);
        var install_path = install_dir + '/' + md5sum.digest('hex');
        install_package(package_path, install_path, run_benchmark);
      }

      function run_benchmark(install_path) {
        var bin_path = install_path + '/firefox/firefox';
        var child = spawn(bin_path, ['-no-remote', '-P', 'benchmark', options.load]);
        child.on('exit', function(code, signal) {
          console.log('exit', code, signal);
          // do something
        });
        worker.task.child = child;
      }
    },
    'complete': function() {
      var worker = this;
      this.task.child.kill('SIGINT');
      this.task.child.on('exit', function() {
        worker.task = null;

        setTimeout(function() {
          var cmd = {
            'method': 'worker.ready'
          };
          worker.send(cmd);
        }, 5000);
      });
    }
  }
};

function Task(options) {
  this.options = options;
  this.child = null;
}

function Worker() {
  var worker = this;
  var mgr_addr;
  var sock;
  var id;

  this.task = null;

  if(!fs.existsSync('wkr_id.json')) {
    id = uuid.v4();
    fs.writeFileSync('wkr_id.json', id);
  } else {
    id = fs.readFileSync('wkr_id.json').toString();
  }

  sock = zmq.socket('req');
  sock.identity = id;

  function handle_message(data) {
    var message = JSON.parse(data.toString());
    var method = message['method'].split('.');
    var options = message['options'];

    var obj = commands;
    for(var i = 0; i < method.length; ++i) {
      var key = method[i];
      obj = obj[key];
      if(undefined == obj) {
        break;
      }
    }
    if(!obj) {
      return;
    }

    obj.call(worker, options);
  }

  var mdns_browser = new mdns.Browser('overwatch');
  mdns_browser.on(mdns.Browser.E_SERVICE_UP, function(svc) {
    mdns_browser.stop();
    mgr_addr = 'tcp://' + svc.addresses[0] + ':' + svc.port;
    sock.connect(mgr_addr);
    sock.on('message', handle_message);
    var cmd = {
      'method': 'worker.ready'
    }
    sock.send(JSON.stringify(cmd));
  });

  function http_handler(req, res) {
    var buffer = '';
    req.on('data', function(chunk) {
      buffer += chunk;
    });
    req.on('end', function(chunk) {
      if(chunk) {
        buffer += chunk;
      }
      res.writeHead(200);
      res.end();

      var cmd = {
        'method': 'worker.result',
        'options': {
          'job': worker.task.options.job,
          'task': worker.task.options.task,
          'value': JSON.parse(buffer)
        }
      };
      sock.send(JSON.stringify(cmd));
    });
  }

  var http_server = http.createServer(http_handler);

  this.start = function start() {
    mdns_browser.start();
    http_server.listen(8080, '127.0.0.1');

    async(function() {
      worker.emit(Worker.E_READY);
    });
  };

  this.stop = function stop() {
    mdns_browser.stop();
    http_server.close();
  };

  this.send = function send(message) {
    sock.send(JSON.stringify(message));
  };
}

inherits(Worker, EventEmitter);

Worker.E_READY = 'READY';

module.exports = Worker;