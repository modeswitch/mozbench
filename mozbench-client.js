process.env['AVAHI_COMPAT_NOWARN'] = 1;

var Discover = require('./common/discover');
var prettyjson = require('prettyjson');
var util = require('util');
var parser = require('./client/cli-parser');
var _ = require('lodash');
var uuid = require('uuid');
var http = require('http');

var args = parser.parseArgs();

var mgr_host;
var mgr_port;

if(args.manager) {

} else {
  var beacon = new Discover.Client('mozbench');
  beacon.on(Discover.Client.E_ANNOUNCE, function(host, port) {
    mgr_host = host;
    mgr_port = port;

    send_command(mgr_host, mgr_port);
  });
  beacon.search();

  setTimeout(function() {
    if(!(mgr_host && mgr_port)) {
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
      process.exit(0);
    })
  });
  req.setHeader('Content-Type', 'application/json');
  req.write(JSON.stringify(cmd));
  req.end();

  req.on('error', function(err) {
    console.error('error:', err);
    process.exit(-1);
  });
}