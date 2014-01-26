process.env['AVAHI_COMPAT_NOWARN'] = 1;

var fs = require('fs');
var Worker = require('./worker/worker');

var install_dir = 'bin';
if(!fs.existsSync(install_dir)) {
  fs.mkdirSync(install_dir);
}

var wkr = new Worker(install_dir);
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