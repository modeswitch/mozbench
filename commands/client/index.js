var argparse = require('argparse');
var config = require('../../config');

function Commands() {
  var that = this;
  this.parser_ = new argparse.ArgumentParser({
    addHelp: true,
    description: 'command-line tool for ' + config.program,
    version: config.version
  });

  this.commands_ = {};
  [
    'debug',
    // 'worker'
  ].forEach(function(cmd) {
    this.commands_[cmd] = require('./' + cmd);
  }.bind(this));

  this.dispatch = function dispatch(cmd, cb) {
    var command = cmd['command'];
    that.commands_[command].dispatch.call(this, cmd, cb);
  };
}

Commands.prototype.register_parser = function register_parser() {
  var parser = this.parser_;

  parser.addArgument(
    ['-M', '--manager'],
    {
      help: 'remote manager network address',
      required: false
    }
  );

  var subparsers = parser.addSubparsers({
    title: 'Commands',
    dest: 'command'
  });

  Object.keys(this.commands_).forEach(function(command) {
    this.commands_[command].register_parser(subparsers);
  }.bind(this));
};

Commands.prototype.parse = function(args) {
  return this.parser_.parseArgs(args);
};

var commands = new Commands();
commands.register_parser();
module.exports = commands;