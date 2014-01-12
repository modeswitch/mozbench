var Manager = require('./manager');

var mgr = new Manager();
mgr.start();
mgr.on('READY', function() {
  console.log('ready!');
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown() {
  console.log('shutting down');
  mgr.stop();
  process.exit();
}