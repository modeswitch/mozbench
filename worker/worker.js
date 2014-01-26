var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('../common/mdns-beacon');
var zmq = require('zmq');
var uuid = require('uuid');
var fs = require('fs');
var async = require('../common/async');
var http = require('http');

function download_installer(url, callback) {

}

function install_browser(installer_path, browser_path) {

}

var commands = {
  'worker': {
    'run': function(options) {
      console.log('run:', options);
      this.task = options;

      // debug
      setTimeout(function() {
        var req = http.request({
          port: 8080,
          hostname: '127.0.0.1',
          method: 'POST'
        }, function(res) {

        });
        req.write(JSON.stringify({
          'score': 0
        }));
        req.end();
      }, 5 * 1000);
    },
    'complete': function() {
      this.task = null;

      var cmd = {
        'method': 'worker.ready'
      };
      this.send(cmd);
    }
  }
};

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
          'job': worker.task.job,
          'task': worker.task.task,
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