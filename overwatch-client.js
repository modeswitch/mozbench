process.env['AVAHI_COMPAT_NOWARN'] = 1;

var mdns = require('mdns2');
var zmq = require('zmq');
var argparse = require('argparse');
var prettyjson = require('prettyjson');
var util = require('util');

/*
var ArgumentParser = argparse.ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'command-line tool for overwatch'
});
parser.addArgument(
  ['-M', '--manager'],
  {
    type: 'string',
    help: 'remote manager network address'
  }
);

var subparsers = parser.addSubparsers({
  title: 'Commands',
  dest: 'command',
});

var debug = subparsers.addParser('debug', {
  addHelp: true
});
var debug_subparsers = debug.addSubparsers({
  title: 'Commands',
  dest: 'subcommand'
})

debug_dump = debug_subparsers.addParser('dump', {
  addHelp: true
});

var worker = subparsers.addParser('worker', {
  addHelp: true
});
var worker_subparsers = worker.addSubparsers({
  title: 'Commands',
  dest: 'subcommand'
})

worker_info = worker_subparsers.addParser('info', {
  addHelp: true
});
worker_info.addArgument(
  ['-n', '--name'],
  {
    type: 'string',
    help: 'worker name',
    nargs: '+',
    action: 'append',
    default: []
  }
);

worker_info.addArgument(
  ['-d', '--device'],
  {
    type: 'string',
    help: 'device name',
    nargs: '+',
    action: 'append',
    default: []
  }
);

worker_add = worker_subparsers.addParser('add', {
  addHelp: true
});
worker_add.addArgument(
  ['worker'],
  {
    type: 'string',
    help: 'worker name'
  }
);
worker_add.addArgument(
  ['device'],
  {
    type: 'string',
    help: 'device name'
  }
);

worker_remove = worker_subparsers.addParser('remove', {
  addHelp: true
});
worker_remove.addArgument(
  ['worker'],
  {
    type: 'string',
    help: 'worker name'
  }
);
worker_remove.addArgument(
  ['device'],
  {
    type: 'string',
    help: 'device name'
  }
);

var device = subparsers.addParser('device', {
  addHelp: true
});
var device_subparsers = device.addSubparsers({
  title: 'Commands',
  dest: 'subcommand'
})

device_info = device_subparsers.addParser('info', {
  addHelp: true
});
device_info.addArgument(
  ['-n', '--name'],
  {
    type: 'string',
    help: 'device name',
    nargs: '*',
    action: 'append'
  }
);
device_info.addArgument(
  ['-o', '--operating-system'],
  {
    type: 'string',
    help: 'operating system name',
    nargs: '*',
    action: 'append'
  }
);
device_info.addArgument(
  ['-c', '--processor'],
  {
    type: 'string',
    help: 'processor name',
    nargs: '*',
    action: 'append'
  }
);
device_info.addArgument(
  ['-m', '--memory'],
  {
    type: 'string',
    help: 'memory',
    nargs: '*',
    action: 'append'
  }
);
device_info.addArgument(
  ['-g', '--graphics-card'],
  {
    type: 'string',
    help: 'graphics card name',
    nargs: '*',
    action: 'append'
  }
);

device_add = device_subparsers.addParser('add', {
  addHelp: true
});
device_add.addArgument(
  ['name'],
  {
    type: 'string',
    help: 'device name'
  }
);
device_add.addArgument(
  ['-o', '--operating-system'],
  {
    type: 'string',
    help: 'operating system name',
    nargs: '?',
    dest: 'os'
  }
);
device_add.addArgument(
  ['-c', '--processor'],
  {
    type: 'string',
    help: 'processor name',
    nargs: '?',
    dest: 'cpu'
  }
);
device_add.addArgument(
  ['-m', '--memory'],
  {
    type: 'string',
    help: 'memory',
    nargs: '?',
    dest: 'memory'
  }
);
device_add.addArgument(
  ['-g', '--graphics-card'],
  {
    type: 'string',
    help: 'graphics card name',
    nargs: '?',
    dest: 'gpu'
  }
);

device_remove = device_subparsers.addParser('remove', {
  addHelp: true
});
device_remove.addArgument(
  ['name'],
  {
    type: 'string',
    help: 'device name'
  }
);

device_modify = device_subparsers.addParser('modify', {
  addHelp: true
});
device_modify.addArgument(
  ['name'],
  {
    type: 'string',
    help: 'device name'
  }
);
device_modify.addArgument(
  ['-o', '--operating-system'],
  {
    type: 'string',
    help: 'operating system name',
    nargs: '?'
  }
);
device_modify.addArgument(
  ['-c', '--processor'],
  {
    type: 'string',
    help: 'processor name',
    nargs: '?'
  }
);
device_modify.addArgument(
  ['-m', '--memory'],
  {
    type: 'string',
    help: 'memory',
    nargs: '?'
  }
);
device_modify.addArgument(
  ['-g', '--graphics-card'],
  {
    type: 'string',
    help: 'graphics card name',
    nargs: '?'
  }
);

device_pool = device_subparsers.addParser('pool', {
  addHelp: true
});
device_pool.addArgument(
  ['device'],
  {
    type: 'string',
    help: 'device name'
  }
);
device_pool.addArgument(
  ['worker'],
  {
    type: 'string',
    help: 'worker name'
  }
);
device_pool_group = device_pool.addMutuallyExclusiveGroup({
  required: true
});
device_pool_group.addArgument(
  ['-a', '--add'],
  {
    type: 'string',
    help: 'add a worker',
    action: 'storeTrue'
  }
);
device_pool_group.addArgument(
  ['-r', '--remove'],
  {
    type: 'string',
    help: 'remove a worker',
    action: 'storeTrue'
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
*/

var client_commands = require('./commands/client');
var args = client_commands.parse();

var client_sock;

var svc_t = {
  'name': 'overwatch-cli',
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
    if(!client_sock) {
      browser.stop();
      console.error('Error: manager not found');
      process.exit(-1);
    }
  }, 1000);
}

function send_command(mgr_addr) {
  client_sock = zmq.socket('req');
  client_sock.connect(mgr_addr);

  client_sock.on('message', function(msg) {
    client_sock.close();
    var result = JSON.parse(msg.toString());
    console.log(prettyjson.render(result));
  });

  var msg = JSON.stringify(args);
  client_sock.send(msg);
}