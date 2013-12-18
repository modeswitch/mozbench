var Bookshelf = require('bookshelf');

var Orm = Bookshelf.initialize({
  client: 'sqlite3',
  connection: {
    filename : './overwatch.sqlite'
  },
  debug: false
});

var Device = Orm.Model.extend({
  tableName: 'devices'
});

Device.forge({name:'nexus4'}).save()
  .then(function(model) {
    console.log(model.get('name'));
  })
  .otherwise(function(err) {
    console.error(err);
  });
