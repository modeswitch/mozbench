var mdns = require('mdns2');

var mgr_port = 9000;

function MdnsAdvertisement() {
  this.svc_t = mdns.makeServiceType('overwatch', 'tcp', 'manager');
  this.mgr_port = 9000;
  this.ad = mdns.createAdvertisement(this.svc_t, this.mgr_port);
}
MdnsAdvertisement.prototype.start = function start() {
  this.ad.start();
};
MdnsAdvertisement.prototype.stop = function stop() {
  this.ad.stop();
}

module.exports = MdnsAdvertisement;