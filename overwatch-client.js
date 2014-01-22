process.env['AVAHI_COMPAT_NOWARN'] = 1;

var mdns = require('mdns2');
var zmq = require('zmq');
var prettyjson = require('prettyjson');
var util = require('util');
var parser = require('./client/cli-parser');
var _ = require('lodash');
var uuid = require('uuid');

var args = parser.parseArgs();

var sock;

var svc_t = {
  'name': 'overwatch',
  'protocol': 'tcp'
};

if(args.manager) {
  var mgr_addr = 'tcp://' + args.manager;

  send_command(mgr_addr);
} else {
  var browser = new mdns.Browser(svc_t);
  browser.on('serviceUp', function(svc_inst) {
    browser.stop();

    var mgr_host = svc_inst.host;
    var mgr_port = svc_inst.port;
    var mgr_addr = 'tcp://' + mgr_host + ':' + mgr_port;

    send_command(mgr_addr);
  });
  browser.start();

  setTimeout(function() {
    if(!sock) {
      browser.stop();
      console.error('Error: manager not found');
      process.exit(-1);
    }
  }, 1000);
}

function send_command(mgr_addr) {
  sock = zmq.socket('req');
  sock.identity = uuid.v4();
  sock.connect(mgr_addr);

  sock.on('message', function(data) {
    sock.close();
    var result = JSON.parse(data.toString());
    console.log(prettyjson.render(result));
  });

  var params = _.omit(args, function(v, k) { return 'function' == typeof v || '@' == k[0]; });
  var cmd = {
    'method': ['client', args['@command'], args['@subcommand']].join('.'),
    'options': params
  };

  var msg = JSON.stringify(cmd);
  sock.send(msg);
}