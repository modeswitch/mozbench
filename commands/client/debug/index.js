var name = 'debug';

function Subcommands() {
  var that = this;
  this.commands_ = {};
  [
    'echo',
  ].forEach(function(cmd) {
    this.commands_[cmd] = require('./' + cmd);
  }.bind(this));

  this.dispatch = function dispatch(cmd, cb) {
    var subcommand = cmd['subcommand'];
    var handler = that.commands_[subcommand].handler;
    handler.call(this, cmd, cb);
  };
}

Subcommands.prototype.register_parser = function register_parser(parent) {
  var parser = parent.addParser(name, {
    addHelp: true
  });

  var subparsers = parser.addSubparsers({
    title: 'Commands',
    dest: 'subcommand'
  });

  Object.keys(this.commands_).forEach(function(command) {
    this.commands_[command].register_parser(subparsers);
  }.bind(this));
};

module.exports = new Subcommands()