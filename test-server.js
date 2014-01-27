/*
var zmq = require('zmq');

var sock = zmq.socket('router');
sock.identity = 'server';
sock.bindSync('tcp://*:7000');

var workers = {};

sock.on('message', function(envelope, delimiter, data) {
  console.log('received:', envelope.toString(), data.toString());
  //sock.send([envelope, undefined, 'OK']);
});
*/

var http = require('http');
var server = http.createServer(function(req, res) {
  console.log('connected');
  res.on('close', function() {
    console.log('client closed');
  });
});

server.setTimeout(0);

server.listen(10080);