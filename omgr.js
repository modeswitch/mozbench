var zmq = require('zmq');
var mdns = require('mdns2');
var uuid = require('uuid');
var arp = require('arp');
var sqlite = require('sqlite3').verbose();

/*
var mgr_id = uuid.v4();
var mgr_svc_t = mdns.makeServiceType('overwatch', 'tcp', 'manager');
var mgr_svc_opts = {name: mgr_id};
var ad = mdns.createAdvertisement(mgr_svc_t, 9000, mgr_svc_opts);
*/

var db = new sqlite.Database('overwatch.sqlite');


// TODO: start web server

var device_pools = {};

var wkr_port = 9001;
var workers = {};

var wkr_svc_t = mdns.makeServiceType('overwatch', 'tcp', 'worker');
var browser = new mdns.Browser(wkr_svc_t);
browser.on('serviceUp', function(svc_inst) {
  // console.log('up', svc_inst);
  wkr_host = svc_inst.host;
  var wkr_sock = zmq.socket('push');
  wkr_sock.connect('tcp://' + wkr_host + ':' + wkr_port);
  workers[svc_inst.name] = wkr_sock;
});
browser.on('serviceDown', function(svc_inst) {
  // console.log('down', svc_inst);
  delete workers[svc_inst.name];
});
browser.start();

var client_sock = zmq.socket('rep');
client_sock.bindSync('tcp://0.0.0.0:9000');
client_sock.on('message', function(msg) {
  msg = JSON.parse(msg);
  if('show' == msg.method) {
    do_show.apply(this, msg.args);
  }
});

function do_show(object) {
  if('workers' == object) {
    this.send(JSON.stringify(Object.keys(workers)));
  } else {
    this.send(JSON.stringify({}));
  }
}