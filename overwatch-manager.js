process.env['AVAHI_COMPAT_NOWARN'] = 1;

var Manager = require('./manager');

var mgr = new Manager();
mgr.start();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('shutting down');
  mgr.stop();
  process.exit();
}

var client_commands = require('./commands/client');
mgr.on(Manager.E_COMMAND, client_commands.dispatch);

function main() {
  console.log('starting');
}

mgr.on(Manager.E_READY, main);