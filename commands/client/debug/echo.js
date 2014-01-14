var name = 'echo';

function register_parser(parent) {
  var parser = parent.addParser(name, {
    addHelp: true
  });
};

function handler(cmd, cb) {
  cb({'echo': true});
};

module.exports = {
  register_parser: register_parser,
  handler: handler
};