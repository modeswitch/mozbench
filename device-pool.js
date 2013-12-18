function DevicePool(device, workers) {
  this.device = device;
  this.workers = workers || [];
}
DevicePool.prototype.flush = function flush(db, callback) {
  var sql = [];

  sql.push('begin transaction');
  sql.push('delete from device_pools where device="' + this.device + '"')

  this.workers.forEach(function(worker) {
    sql.push('insert into device_pools(device, worker) values("' + this.device + '", "' + worker + '")')
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
DevicePool.fetch = function fetch(db, device, callback) {
  db.all('select * from device_pools where device=?', [device], function(err, rows) {
    if(err) {
      return callback(err);
    }

    var device_pool = new DevicePool(device);

    rows.forEach(function(row) {
      device_pool.workers.push(row.worker);
    });

    return callback(null, device_pool);
  });
};
DevicePool.fetch_all = function fetch_all(db, callback) {
  db.all('select * from device_pools', function(err, rows) {
    if(err) {
      return callback(err);
    }

    var device_pools = {};

    rows.forEach(function(row) {
      var device = row.device;
      var worker = row.worker;

      if(!(device in device_pools)) {
        device_pools[device] = new DevicePool(device);
      }

      device_pools[device].workers.push(worker);
    });

    return callback(null, device_pools);
  });
};

module.exports = DevicePool;