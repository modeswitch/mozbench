var zmq = require('zmq');
var uuid = require('uuid');

var sock = zmq.socket('req');
sock.identity = uuid.v4();
sock.connect('tcp://127.0.0.1:7000');

sock.on('message', function(data) {
  console.log('received:', data.toString());
});

sock.send('READY');