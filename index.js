'use strict';

module.exports = hashed;

function hashed (options) {
  options || (options = {});
  return new Hashed(options);
}

var crypto = require('crypto');
var fs = require('graceful-fs');
var node_path = require('path');

var fse = require('fs-extra');
var make_array = require('make-array');
var wrap = require('wrap-as-async');
var async = require('async');

hashed.Hashed = Hashed;
hashed.cache = require('./lib/cache');


// Default method to crypto a file according to the file content.
function crypto_iterator () {
  var md5 = crypto.createHash('md5');
  return function (data) {
    if (data.value) {
      md5.update(data.value);
    }

    if (data.done) {
      return md5.digest('hex');
    }
  }
}


var REGEX_EXT = /\.[a-z0-9]+$/;
function decorate (basename, hash) {
  return basename.replace(REGEX_EXT, function (ext) {
    return '-' + hash.slice(0, 7) + ext;
  });
}


// @param {Object} options
// - crypto: `function()`
function Hashed (options) {
  this.options = options;
  this.options.crypto = options.crypto || crypto_iterator();
  this.options.decorate = wrap(options.decorate || decorate);
  this.cache = hashed.cache(this.options.cache_file);
}


// @param {function(err, data, stat)}
Hashed.prototype.readFile = function(filename, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  this.stat(filename, function (err, stat, hash) {
    if (err) {
      return callback(err);
    }

    fs.readFile(filename, options, function (err, content) {
      if (err) {
        return callback(err);
      }

      callback(null, content, hash);
    });
  });
};


// @param {function(err, stat, skipped)}
Hashed.prototype.copy = function(filename, dest_dir, callback, force) {
  var self = this;

  this.stat(filename, function (err, stat, hash, cached) {
    if (err) {
      return callback(err);
    }

    // If cached, skip copying
    if (cached && !force) {
      return callback(null, hash, true);
    }

    var basename = node_path.basename(filename);
    async.parallel([
      function (done) {
        fse.copy(filename, node_path.join(dest_dir, basename), done);
      },

      function (done) {
        async.waterfall([
          function (sub_done) {
            self.options.decorate(basename, hash, sub_done);
          },

          function (decorated, sub_done) {
            var dest = node_path.join(dest_dir, decorated);
            fse.copy(filename, dest, sub_done);
          }
        ], done)
      }
      
    ], function (err) {
      if (err) {
        return callback(err);
      }

      callback(err, hash, false);
    });
  });
};


Hashed.prototype._encryt_file = function(filename, callback) {
  var crypto_iterator = this.options.crypto;
  fs.createReadStream(filename)
    .on('data', function (data) {
      crypto_iterator({
        value: data
      });
    })
    .on('error', callback)
    .on('end', function () {
      var hash = crypto_iterator({
        done: true
      });
      callback(null, hash);
    });
};


Hashed.prototype.writeFile = function(dest_filename, content, callback) {
  var hash = this.options.crypto({
    done: true,
    value: content
  });

  var self = this;
  async.parallel([
    function (done) {
      fs.writeFile(dest_filename, content, done);
    },

    function (done) {
      async.waterfall([
        function (sub_done) {
          self.options.decorate(dest_filename, hash, sub_done);
        },

        function (decorated, sub_done) {
          fs.writeFile(decorated, content, sub_done);
        }
      ], done)
    }
    
  ], function (err) {
    if (err) {
      return callback(err);
    }

    callback(err, hash);
  });
};


Hashed.prototype.stat = function(filename, callback) {
  var self = this;
  this.cache.ready(function (err) {
    if (err) {
      return callback(err);
    }

    self._stat(filename, callback);
  });
};


// @param {function(err, stat, cached)} callback
Hashed.prototype._stat = function(filename, callback) {
  filename = node_path.resolve(filename);

  var self = this;
  fs.stat(filename, function (err, stat) {
    if (err) {
      self.cache.remove(filename);
      return callback(err);
    }

    var mtime = + stat.mtime;
    var hash = self.cache.get(filename, mtime);

    if (hash) {
      return callback(null, stat, hash, true);
    }

    self._createHashed(filename, function (err, hash) {
      if (err) {
        return callback(err);
      }

      self.cache.set(filename, mtime, hash);
      callback(null, stat, hash, false);
    });
  });
};


Hashed.prototype._createHashed = function(filename, callback) {
  var called;
  function once (err, result) {
    if (called) {
      return;
    }
    called = true;
    callback(err, result);
  }

  this._encryt_file(filename, once);
};
