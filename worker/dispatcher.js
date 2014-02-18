var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var async = require('../common/async');
var fs = require('fs');
var path = require('path');
var http = require('http');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var _ = require('lodash');

var install_dir = '/tmp';

function install_package(package_path, install_path, profile_name, callback) {
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
    var profile_path = install_path + '/profile';
    var child = exec(bin_path + ' -no-remote -CreateProfile "' + profile_name + ' ' + profile_path + '"');
    child.on('exit', function(code, signal) {
      if(0 == code) {
        var user_js = [
          'user_pref("browser.sessionstore.resume_from_crash", false);',
          'user_pref("app.update.auto", false);',
          'user_pref("app.update.auto", false);',
          'user_pref("app.update.auto", false);',
          'user_pref("browser.shell.checkDefaultBrowser", false);'
        ].join('\n');
        fs.writeFileSync(profile_path + '/user.js', user_js);
        callback(install_path);
      } else {

      }
    });
  }
}

var handlers = {
  'worker': {
    'run': function(sender, options, callback) {
      console.log('run', options);
      var worker = this;
      var profile_name;

      worker.downloader.fetch(options.install, do_install);

      function do_install(package_prefix, package_path) {
        var install_path = install_dir + '/' + package_prefix;
        profile_name = package_prefix;

        install_package(package_path, install_path, profile_name, run_benchmark);
      }

      function run_benchmark(install_path) {
        var bin_path = install_path + '/firefox/firefox';

        var query_string = [
          ['worker', options.worker].join('='),
          ['reply', 'http://' + sender].join('=')
        ].join('&');

        var load = options.load + '?' + query_string;
        var child = spawn(bin_path, ['-no-remote', '-P', profile_name, load]);
        child.on('exit', function(code, signal) {
          console.log('exit', code, signal);
          worker.child = null;
        });
        worker.child = child;
      }

      callback();
    },
    'reset': function(sender, options, callback) {
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
  var options = message.data.options || {};
  var sender = message.host + ':' + message.port;

  var method = message.data.method.split('.');
  for(var i = 0; i < method.length; ++i) {
    var key = method[i];
    handler = handler[key];
    if(undefined == handler) {
      break;
    }
  }

  this.call = function call(context, callback) {
    handler.call(context, sender, options, callback);
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