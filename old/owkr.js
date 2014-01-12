var mdns = require('mdns2');
var uuid = require('uuid');
var zmq = require('zmq');
var fs = require('fs');

var wkr_port = 9001;
var wkr_sock = zmq.socket('pull');
wkr_sock.bindSync('tcp://0.0.0.0:' + wkr_port);

wkr_sock.on('message', function(msg) {
  msg = JSON.parse(msg.toString());
});

var wkr_id;
if(!fs.existsSync('wkr_id.json')) {
  wkr_id = uuid.v4();
  fs.writeFileSync('wkr_id.json', wkr_id);
} else {
  wkr_id = fs.readFileSync('wkr_id.json').toString();
}

var wkr_svc_t = mdns.makeServiceType('overwatch', 'tcp', 'worker');
var wkr_svc_opts = {name: wkr_id};
var ad = mdns.createAdvertisement(wkr_svc_t, wkr_port, wkr_svc_opts);
ad.start();
