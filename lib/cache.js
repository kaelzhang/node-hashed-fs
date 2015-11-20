'use strict';

module.exports = cache;
cache.cache = cached;
cache.Cache = Cache;

var access = require('object-access');
var AC = require('async-cache');
var fs = require('graceful-fs');

var cached = {};

function cache (file) {
  file = file || undefined;

  // during a same session, 
  // only creates a single cache instance for one cache file.
  return cached[file] || (cached[file] = new Cache(file));
}


function Cache (file) {
  if (!file) {
    // There is no file cache
    this.cache = {};
    return;
  }

  this.cache_file = file;
  var self = this;
  this.ac = new AC({
    max: 1000,
    maxAge: 1000 * 60 * 10,

    // actually, the key is fake 
    load: function (key, callback) {
      fs.readFile(self.cache_file, function (err, content) {
        if (err) {
          return callback(err);
        }

        try {
          var json = JSON.parse(content.toString());
        } catch(e) {
          return callback(e);
        }

        self.cache = json;
      });
    }
  });

  process.on('exit', function () {
    fs.writeFileSync(self.cache_file, JSON.stringify(self.cache));
  });
}


Cache.prototype.ready = function(callback) {
  if (this.cache_file) {
    return this._ready(callback);
  }

  // if no cache file, emit ready directly
  callback(null);
};


Cache.prototype._ready = function(callback) {
  this.ac.get('', function (err) {
    callback(err);
  });
};


Cache.prototype.set = function (filename, mtime, info) {
  access.set(this.cache, [filename, mtime], info);
};


Cache.prototype.get = function (filename, mtime) {
  return access(this.cache, [filename, mtime]);
};


Cache.prototype.remove = function (filename) {
  access.remove(this.cache, [filename]);
};

