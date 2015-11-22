'use strict';

module.exports = cache;
cache.cache = cached;
cache.Cache = Cache;

var access = require('object-access');
var AC = require('async-cache');
var fs = require('graceful-fs');
var clone = require('clone');

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

  // To handle high concurrency
  this.ac = new AC({
    max: 1000,
    maxAge: 1000 * 60 * 10,

    // actually, the key is fake
    load: function (key, callback) {
      fs.readFile(self.cache_file, function (err, content) {
        if (err) {

          // if the cache_file not found, error will not throw
          if (err.code === 'ENOENT') {
            self.cache = {};
            return callback(null);
          }

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
  if (!arguments.length) {
    return clone(this.cache);
  }

  var hash = access(this.cache, [filename, mtime]);
  if (!hash) {
    // removes old dirty data.
    this.remove(filename);
  }

  return hash;
};


Cache.prototype.remove = function (filename) {
  access.remove(this.cache, [filename]);
};


// Gets the {path: hash} map
Cache.prototype.map = function() {
  var cache = this.cache;
  var files = Object.keys(cache);
  var map = {};
  files.forEach(function (file) {
    var obj = cache[file];
    var mtime;
    for (mtime in obj) {
      map[file] = obj[mtime];
      break;
    }
  });

  return map;
};


Cache.prototype.save = function(callback) {
  if (!this.cache_file) {
    return callback(null);
  }

  try {
    var content = JSON.stringify(this.cache);
  } catch(e) {
    return callback(e);
  }

  fs.writeFile(this.cache_file, content, callback);
};
