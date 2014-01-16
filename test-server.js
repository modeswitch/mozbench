var zmq = require('zmq');

var sock = zmq.socket('router');
sock.identity = 'server';
sock.bindSync('tcp://*:7000');

var workers = {};

sock.on('message', function(envelope, delimiter, data) {
  console.log('received:', envelope.toString(), data.toString());
  //sock.send([envelope, undefined, 'OK']);
});