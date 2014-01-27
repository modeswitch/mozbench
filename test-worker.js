/*
var zmq = require('zmq');
var uuid = require('uuid');

var sock = zmq.socket('req');
sock.identity = uuid.v4();
sock.connect('tcp://127.0.0.1:7000');

sock.on('message', function(data) {
  console.log('received:', data.toString());
});

sock.send('READY');
*/

var http = require('http');
var opts = {
  port: 10080,
  hostname: '127.0.0.1',
  method: 'post'
};
var req = http.request(opts, function(res) {

});
req.setTimeout(0);
req.on('error', function(err) {
  console.error('server error:', err);
});
req.end();