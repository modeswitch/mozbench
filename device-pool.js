function DevicePool(device, workers) {
  this.device = device;
  this.workers = workers || [];
}
DevicePool.prototype.insert = function insert(db, callback) {
  var sql = [];

  sql.push('being transaction');
  sql.push('delete from device_pool where device="' + this.device + '"')

  this.workers.forEach(function(worker) {
    sql.push('insert into device_pool(device, worker) values("' + this.device + '", "' + worker + '")')
  }.bind(this));

  sql.push('end transaction');

  sql = sql.join(';');
  db.exec(sql, function(err) {
    if(err) {
      return callback(err);
    } else {
      return callback(null);
    }
  });
};
DevicePool.prototype.update = DevicePool.prototype.insert;
