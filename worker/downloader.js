var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var url = require('url');
var crypto = require('crypto');

function Downloader(package_dir) {
  if(!fs.existsSync(package_dir)) {
    fs.mkdirSync(package_dir);
  }

  this.fetch = function fetch(target, callback) {
    var target = url.parse(target);
    var request;
    if(target.protocol == 'https:') {
      request = https.request;
    } else {
      request = http.request;
    }

    function get_headers() {
      target.method = 'HEAD';
      var etag;
      var req = request(target, function(res) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(res.headers['etag']);
        md5sum.update(res.headers['last-modified']);
        md5sum.update(res.headers['content-length']);
        var package_prefix = md5sum.digest('hex');
        var package_name = [package_prefix, path.basename(target.path)].join('-');
        var package_path = [package_dir, package_name].join('/');
        return get_package(package_path);
      });
      req.end();
    }

    function get_package(package_path) {
      if(fs.existsSync(package_path)) {
        console.log('package already downloaded');
        return callback(package_path);
      }

      target.method = 'GET';
      var req = request(target, function(res) {
        res.on('data', function(chunk) {
          fs.appendFileSync(package_path, chunk, {encoding: 'binary'});
        });
        res.on('end', function(chunk) {
          if(chunk) {
            fs.appendFileSync(package_path, chunk, {encoding: 'binary'});
          }
          return callback(package_path);
        });
        res.on('error', function(err) {
          console.error('error', err);
          fs.unlinkSync(package_path);
        });
      });
      req.end();
    }

    get_headers();
  }
}

module.exports = Downloader;