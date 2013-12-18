function Device(name, os, cpu, memory, gpu, synced) {
  this.name = name;
  this.os = os || null;
  this.cpu = cpu || null;
  this.memory = memory || null;
  this.gpu = gpu || null;
  this.synced = (undefined === synced) ? false : true;
}
Device.prototype.flush = function flush(db, callback) {
  if(this.synced) {
    db.run('update devices set name=?, os=?, cpu=?, memory=?, gpu=? where name=?',
      [this.name, this.os, this.cpu, this.memory, this.gpu, this.name], function(err) {
        if(err) {
          return callback(err);
        }

        callback(null);
      }.bind(this));
  } else {
    db.run('insert into devices(name, os, cpu, memory, gpu) values(?, ?, ?, ?, ?)',
      [this.name, this.os, this.cpu, this.memory, this.gpu], function(err) {
        if(err) {
          return callback(err);
        }

        this.synced = true;
        callback(null);
      }.bind(this));
  }
};
Device.fetch = function fetch(db, name, callback) {
  db.get('select * from devices where name=?', [name], function(err, row) {
    if(err) {
      return callback(err);
    }

    var device = new Device(name, row.os, row.cpu, row.memory, row.gpu, true);
    callback(null, device);
  });
};
Device.fetch_all = function fetch_all(db, callback) {
  db.all('select * from devices', [], function(err, rows) {
    if(err) {
      return callback(err);
    }

    var devices = {};
    rows.forEach(function(row) {
      var name = row.name;
      var device = new Device(name, row.os, row.cpu, row.memory, row.gpu, true);
      devices[name] = device;
    });

    callback(null, devices);
  });
}

module.exports = Device;