var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('mdns2');

function MdnsAd(port, name) {
  var svc_t = {
    'name': name,
    'protocol': 'tcp'
  };
  var ad = mdns.createAdvertisement(svc_t, port);

  this.start = function() {
    ad.start();
  }

  this.stop = function() {
    ad.stop();
  }
}

function MdnsBrowser(name) {
  var that = this;
  var svc_t = {
    'name': name,
    'protocol': 'tcp'
  };
  var browser = new mdns.Browser(svc_t);
  browser.on('serviceUp', function(svc_inst) {
    that.emit(MdnsBrowser.E_SERVICE_UP, svc_inst);
  });
  browser.on('serviceDown', function(svc_inst) {
    that.emit(MdnsBrowser.E_SERVICE_DOWN, svc_inst);
  });

  this.start = function() {
    browser.start();
  }

  this.stop = function() {
    browser.stop();
  }
}

inherits(MdnsBrowser, EventEmitter);

MdnsBrowser.E_SERVICE_UP = 'SERVICE_UP';
MdnsBrowser.E_SERVICE_DOWN = 'SERVICE_DOWN';

module.exports = {
  Ad: MdnsAd,
  Browser: MdnsBrowser
};