var MdnsAdvertisement = require('./mgr-mdns');

function Manager() {
  this.mdns_ad = new MdnsAdvertisement();
  this.init_queue = [
    this.mdns.start
  ];
}
Manager.prototype.start = function start(callback) {
  this.mdns_ad.start();
};
Manager.prototype.stop = function stop(callback) {
  this.mdns_ad.stop();
};