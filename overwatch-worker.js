process.env['AVAHI_COMPAT_NOWARN'] = 1;

var Worker = require('./worker/worker');

var wkr = new Worker();
wkr.start();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('shutting down');
  wkr.stop();
  process.exit();
}

function main() {
  console.log('starting');
}

wkr.on(Worker.E_READY, main);