process.env['AVAHI_COMPAT_NOWARN'] = 1;

var mdns = require('mdns2');
var zmq = require('zmq');
var prettyjson = require('prettyjson');
var util = require('util');
var parser = require('./client/cli-parser');
var _ = require('lodash');
var uuid = require('uuid');
var http = require('http');

var args = parser.parseArgs();

var svc_t = {
  'name': 'overwatch',
  'protocol': 'tcp'
};

var mgr_host;
var mgr_port;

if(args.manager) {

} else {
  var browser = new mdns.Browser(svc_t);
  browser.on('serviceUp', function(svc_inst) {
    browser.stop();

    mgr_host = svc_inst.host;
    mgr_port = svc_inst.port;

    send_command(mgr_host, mgr_port);
  });
  browser.start();

  setTimeout(function() {
    if(!(mgr_host && mgr_port)) {
      browser.stop();
      console.error('Error: manager not found');
      process.exit(-1);
    }
  }, 1000);
}

function send_command(mgr_host, mgr_port) {
  var params = _.omit(args, function(v, k) { return 'function' == typeof v || '@' == k[0]; });
  var cmd = {
    'method': ['client', args['@command'], args['@subcommand']].join('.'),
    'options': params
  };

  var opts = {
    hostname: mgr_host,
    port: mgr_port,
    method: 'post'
  };
  var req = http.request(opts, function(res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function(chunk) {
      if(chunk) {
        data += chunk;
      }
      console.log(JSON.parse(data));
    })
  });
  req.setHeader('Content-Type', 'application/json');
  req.write(JSON.stringify(cmd));
  req.end();

  req.on('error', function(err) {
    console.error('error:', err);
  });
}