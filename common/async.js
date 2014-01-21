function queue(cb) {
  setTimeout(cb, 0);
}

module.exports = queue;