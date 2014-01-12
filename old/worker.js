function Worker(name, synced) {
  this.name = name;
  this.synced = (undefined === synced) ? false : true;
}
Worker.prototype.flush = function flush(db, callback) {
  if(this.synced) {
    db.run('update workers set name=? where name=?',
      [this.name, this.name], function(err) {
        if(err) {
          return callback(err);
        }

        this.synced = true;
        callback(null);
      }.bind(this));
  } else {
    db.run('insert into workers(name) values(?)',
      [this.name], function(err) {
        if(err) {
          return callback(err);
        }

        this.synced = true;
        callback(null);
      }.bind(this));
  }
};
Worker.fetch = function fetch(db, name, callback) {
  db.get('select * from workers where name=?', [name], function(err, row) {
    if(err) {
      return callback(err);
    }

    var worker = new Worker(name, true);
    return callback(null, worker);
  });
};
Worker.fetch_all = function fetch_all(db, callback) {
  db.all('select * from workers', [], function(err, rows) {
    if(err) {
      return callback(err);
    }

    var workers = {};
    rows.forEach(function(row) {
      var name = row.name;
      var worker = new Worker(name, true);
      workers[name] = worker;
    });

    return callback(null, workers);
  });
}

module.exports = Worker;