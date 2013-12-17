#!/usr/bin/env node

var zmq = require('zmq');
var program = require('commander');

// var client_sock = zmq.socket('req');

function do_error(msg) {
  console.error('\n  error: %s\n', msg);
  process.exit();
}

function required(name, msg) {
  if(undefined === name)
    do_error(msg);
  else
    return name
}

function Command(method, args) {
  this.method = method;
  this.args = args;
}

program
  .version('0.0.1')
  .option('-m --manager <manager>', 'manager network address')
  .description('command-line client for overwatch');

program
  .command('queue <benchmark>')
  .description('queue a benchmark to run')
  .option('-d, --device <device>', 'device pool name')
  .option('-b, --browser <browser>', 'browser name')
  .option('-c, --channel <channel>', 'release channel name')
  .option('-r, --replicates <replicates>', 'number of replicates to run')
  .action(function(benchmark, cmd) {
    console.log(benchmark);
  });

program
  .command('show <object>')
  .action(function(object, cmd) {
    var mgr_host = required(program.manager, 'missing manager network address');
    var mgr_addr = 'tcp://' + mgr_host + ':9000';

    var client_sock = zmq.socket('req');
    client_sock.connect(mgr_addr);

    client_sock.on('message', function(msg) {
      console.log(msg.toString());
      client_sock.close();
    });

    var msg = JSON.stringify(new Command('show', [object]));
    client_sock.send(msg);
  });

program.parse(process.argv);