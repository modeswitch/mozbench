var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var mdns = require('mdns2');
var async = require('./async');

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
  var browser;

  function handle_service_up(svc_inst) {
    var host = svc_inst.addresses[0];
    var port = svc_inst.port;

    console.log('manager found:', host, port);
    async(function() {
      that.emit(MdnsBrowser.E_MANAGER, host, port);
    });
    this.stop();
  }

  this.search = function() {
    console.log('scanning for manager');

    browser = new mdns.Browser(svc_t);
    browser.on('serviceUp', handle_service_up);
    browser.start();
  }

  this.stop = function() {
    if(browser) {
      browser.stop();
      browser.removeAllListeners();
      browser = null;
    }
  }
}

inherits(MdnsBrowser, EventEmitter);

MdnsBrowser.E_MANAGER = 'MANAGER';

module.exports = {
  Ad: MdnsAd,
  Browser: MdnsBrowser
};