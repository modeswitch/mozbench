var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var http = require('http');
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

var handlers = {
  'worker': {
    'run': function(options, callback) {
      console.log('run', options);
      var worker = this;

      download_installer(options.install, do_install);

      function do_install(package_path) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(options.install);
        var install_path = install_dir + '/' + md5sum.digest('hex');
        install_package(package_path, install_path, run_benchmark);
      }

      function run_benchmark(install_path) {
        var bin_path = install_path + '/firefox/firefox';
        var load = options.load + '?worker=' + options.worker;
        var child = spawn(bin_path, ['-no-remote', '-P', 'benchmark', load]);
        child.on('exit', function(code, signal) {
          console.log('exit', code, signal);
          worker.child = null;
        });
        worker.child = child;
      }

      callback();
    },
    'reset': function(options, callback) {
      var worker = this;

      if(worker.child) {
        worker.child.kill('SIGINT');
        worker.child.on('exit', function() {
          worker.child = null;
          callback();
        });
      } else {
        callback();
      }
    }
  }
};

function Operation(dispatcher, message) {
  var operation = this;
  var handler = handlers;
  var options = message.options || {};

  var method = message.method.split('.');
  for(var i = 0; i < method.length; ++i) {
    var key = method[i];
    handler = handler[key];
    if(undefined == handler) {
      break;
    }
  }

  this.call = function call(context, callback) {
    handler.call(context, options, callback);
  };
}

function Dispatcher(worker) {
  var dispatcher = this;
  this.run = function run(message, callback) {
    var operation = new Operation(dispatcher, message);
    operation.call(worker, callback);
  }
}

module.exports = Dispatcher;