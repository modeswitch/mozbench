function queue(cb) {
  process.nextTick(cb);
}

module.exports = queue;