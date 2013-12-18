#!/usr/bin/env node

var zmq = require('zmq');
var argparse = require('argparse');

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

function Message(command, subcommand, args) {
  this.command = command;
  this.subcommand = subcommand;
  this.args = args;
}

var ArgumentParser = argparse.ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'command-line tool for overwatch'
});
parser.addArgument(
  ['-M', '--manager'],
  {
    help: 'remote manager network address',
    required: true
  }
);

var subparsers = parser.addSubparsers({
  title: 'Commands',
  dest: 'command'
});

var workers = subparsers.addParser('workers', {
  addHelp: true
});
var workers_subparsers = workers.addSubparsers({
  title: 'Commands',
  dest: 'subcommand'
})

workers_info = workers_subparsers.addParser('info', {
  addHelp: true
});
workers_info.addArgument(
  ['-n', '--name'],
  {
    type: 'string',
    help: 'worker name',
    nargs: '+',
    action: 'append',
    default: []
  }
);

workers_info.addArgument(
  ['-d', '--device'],
  {
    type: 'string',
    help: 'device name',
    nargs: '+',
    action: 'append',
    default: []
  }
);

workers_add = workers_subparsers.addParser('add', {
  addHelp: true
});
workers_add.addArgument(
  ['worker'],
  {
    type: 'string',
    help: 'worker name'
  }
);
workers_add.addArgument(
  ['device'],
  {
    type: 'string',
    help: 'device name'
  }
);

workers_remove = workers_subparsers.addParser('remove', {
  addHelp: true
});
workers_remove.addArgument(
  ['worker'],
  {
    type: 'string',
    help: 'worker name'
  }
);
workers_remove.addArgument(
  ['device'],
  {
    type: 'string',
    help: 'device name'
  }
);

var devices = subparsers.addParser('devices', {
  addHelp: true
});
var devices_subparsers = devices.addSubparsers({
  title: 'Commands',
  dest: 'subcommand'
})

devices_info = devices_subparsers.addParser('info', {
  addHelp: true
});
devices_info.addArgument(
  ['-n', '--name'],
  {
    type: 'string',
    help: 'device name',
    nargs: '*',
    action: 'append'
  }
);
devices_info.addArgument(
  ['-o', '--operating-system'],
  {
    type: 'string',
    help: 'operating system name',
    nargs: '*',
    action: 'append'
  }
);
devices_info.addArgument(
  ['-c', '--processor'],
  {
    type: 'string',
    help: 'processor name',
    nargs: '*',
    action: 'append'
  }
);
devices_info.addArgument(
  ['-m', '--memory'],
  {
    type: 'string',
    help: 'memory',
    nargs: '*',
    action: 'append'
  }
);
devices_info.addArgument(
  ['-g', '--graphics-card'],
  {
    type: 'string',
    help: 'graphics card name',
    nargs: '*',
    action: 'append'
  }
);

devices_add = devices_subparsers.addParser('add', {
  addHelp: true
});
devices_add.addArgument(
  ['name'],
  {
    type: 'string',
    help: 'device name'
  }
);
devices_add.addArgument(
  ['-o', '--operating-system'],
  {
    type: 'string',
    help: 'operating system name',
    nargs: '?',
    dest: 'os'
  }
);
devices_add.addArgument(
  ['-c', '--processor'],
  {
    type: 'string',
    help: 'processor name',
    nargs: '?',
    dest: 'cpu'
  }
);
devices_add.addArgument(
  ['-m', '--memory'],
  {
    type: 'string',
    help: 'memory',
    nargs: '?',
    dest: 'memory'
  }
);
devices_add.addArgument(
  ['-g', '--graphics-card'],
  {
    type: 'string',
    help: 'graphics card name',
    nargs: '?',
    dest: 'gpu'
  }
);

devices_remove = devices_subparsers.addParser('remove', {
  addHelp: true
});
devices_remove.addArgument(
  ['name'],
  {
    type: 'string',
    help: 'device name'
  }
);

devices_modify = devices_subparsers.addParser('modify', {
  addHelp: true
});
devices_modify.addArgument(
  ['name'],
  {
    type: 'string',
    help: 'device name'
  }
);
devices_modify.addArgument(
  ['-o', '--operating-system'],
  {
    type: 'string',
    help: 'operating system name',
    nargs: '?'
  }
);
devices_modify.addArgument(
  ['-c', '--processor'],
  {
    type: 'string',
    help: 'processor name',
    nargs: '?'
  }
);
devices_modify.addArgument(
  ['-m', '--memory'],
  {
    type: 'string',
    help: 'memory',
    nargs: '?'
  }
);
devices_modify.addArgument(
  ['-g', '--graphics-card'],
  {
    type: 'string',
    help: 'graphics card name',
    nargs: '?'
  }
);

var queue = subparsers.addParser('queue', {
  addHelp: true
});
var queue_subparsers = queue.addSubparsers({
  title: 'Commands',
  dest: 'subcommand'
})

queue_info = queue_subparsers.addParser('info', {
  addHelp: true
});
queue_info.addArgument(
  ['-j', '--job'],
  {
    type: 'string',
    help: 'job id',
    nargs: '?',
    action: 'append'
  }
);
queue_info.addArgument(
  ['-s', '--status'],
  {
    type: 'string',
    help: 'job status',
    nargs: '?',
    action: 'append'
  }
);
queue_info.addArgument(
  ['-d', '--device'],
  {
    type: 'string',
    help: 'device name',
    nargs: '?',
    action: 'append'
  }
);
queue_info.addArgument(
  ['-b', '--benchmark'],
  {
    type: 'string',
    help: 'benchmark name',
    nargs: '?',
    action: 'append'
  }
);
queue_info.addArgument(
  ['-r', '--browser'],
  {
    type: 'string',
    help: 'browser name',
    nargs: '?',
    action: 'append'
  }
);

queue_add = queue_subparsers.addParser('add', {
  addHelp: true
});
queue_add.addArgument(
  ['device'],
  {
    type: 'string',
    help: 'device name'
  }
);
queue_add.addArgument(
  ['benchmark'],
  {
    type: 'string',
    help: 'benchmark name'
  }
);
queue_add.addArgument(
  ['browser'],
  {
    type: 'string',
    help: 'browser name'
  }
);

queue_remove = queue_subparsers.addParser('remove', {
  addHelp: true
});
queue_remove.addArgument(
  ['job'],
  {
    type: 'string',
    help: 'job id'
  }
);

var args = parser.parseArgs();

var mgr_host = args.manager;
var mgr_addr = 'tcp://' + mgr_host + ':9000';

var client_sock = zmq.socket('req');
client_sock.connect(mgr_addr);

client_sock.on('message', function(msg) {
  console.log(msg.toString());
  client_sock.close();
});

var msg = JSON.stringify(args);
client_sock.send(msg);

function cmd_workers_info(args) {
  var command = args.command;
  var subcommand = args.subcommand;

  var name = [].concat.apply([], args.name);
  name = name.filter(function(e, p) {
    return name.indexOf(e) == p;
  });

  var device = [].concat.apply([], args.device);
  device = device.filter(function(e, p) {
    return device.indexOf(e) == p;
  });

  var mgr_host = args.manager;
  var mgr_addr = 'tcp://' + mgr_host + ':9000';

  var client_sock = zmq.socket('req');
  client_sock.connect(mgr_addr);

  client_sock.on('message', function(msg) {
    console.log(msg.toString());
    client_sock.close();
  });

  var msg = JSON.stringify(new Message(command, subcommand, [name, device]));
  client_sock.send(msg);
}

/*
program
  .command('queue <device> <browser> <benchmark>')
  .description('queue a benchmark to run')
  .option('-r, --replicates <replicates>', 'number of replicates to run')
  .action(function(benchmark, cmd) {
    console.log(benchmark);
  });
*/

/*
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

    var msg = JSON.stringify(new Message('show', [object]));
    client_sock.send(msg);
  });
*/

/*
program
  .command('assign <device> <worker>')
  .action(function(device, worker, cmd) {
    var mgr_host = required(program.manager, 'missing manager network address');
    var mgr_addr = 'tcp://' + mgr_host + ':9000';

    var client_sock = zmq.socket('req');
    client_sock.connect(mgr_addr);

    client_sock.on('message', function(msg) {
      console.log(msg.toString());
      client_sock.close();
    });

    var msg = JSON.stringify(new Message('assign', [device, worker]));
    client_sock.send(msg);
  });
*/
