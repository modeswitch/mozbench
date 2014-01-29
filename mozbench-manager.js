process.env['AVAHI_COMPAT_NOWARN'] = 1;

var Manager = require('./manager/manager');

var mgr = new Manager(9000);
mgr.start();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('shutting down');
  mgr.stop();
  process.exit();
}

function main() {
  console.log('starting');
}

mgr.on(Manager.E_READY, main);