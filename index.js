'use strict';

module.exports = hashed;
hashed.decorate = decorate;
hashed.Hashed = Hashed;
hashed.cache = require('./lib/cache');

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


// Default method to crypto a file according to the file content.
function crypto_file (filename) {
  var done = this.async();

  var md5 = crypto.createHash('md5');
  var rs = fs.createReadStream(filename)
    .on('data', function (data) {
      md5.update(data);
    })
    .on('error', done)
    .on('end', function () {
      var hash = md5.digest('hex');
      done(null, hash);
    });
}


var REGEX_EXT = /\.[a-z0-9]$/;
function decorate (basename, hash) {
  return basename.replace(REGEX_EXT, function (ext) {
    return '.' + hash.slice(0, 7) + ext;
  });
}


// @param {Object} options
// - crypto: `function()`
function Hashed (options) {
  this.options = options;
  this.options.crypto = wrap(options.crypto || crypto_file);
  this.options.decorate = wrap(options.decorate || decorate);
  this.cache = hashed.cache(this.options.cache_file);
}


// @param {function(err, data, stat)}
Hashed.prototype.readFile = function(filename, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  this.stat(filename, function (err, stat) {
    if (err) {
      return callback(err);
    }

    fs.readFile(filename, options, function (err, content) {
      if (err) {
        return callback(err);
      }

      callback(null, content, stat);
    });
  });
};


// @param {function(err, stat, skipped)}
Hashed.prototype.copy = function(filename, dest_dir, callback, force) {
  var self = this;

  this.stat(filename, function (err, stat, cached) {
    if (err) {
      return callback(err);
    }

    // If cached, skip copying
    if (cached && !force) {
      return callback(null, stat, true);
    }

    var basename = node_path.basename(filename);
    async.parallel([
      function (done) {
        fse.copy(filename, node_path.join(dest_dir, basename), done);
      },

      async.waterfall([
        function (sub_done) {
          self.options.decorate(basename, hashed, sub_done);
        },

        function (decorated, sub_done) {
          var dest = node_path.join(dest_dir, decorated_basename);
          fse.copy(filename, dest, sub_done);
        }
      ], done)
      
    ], function (err) {
      if (err) {
        return callback(err);
      }

      callback(err, stat, false);
    });
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
    var info = self.cache.get(filename, mtime);

    if (info) {
      return callback(null, info, true);
    }

    self._createHashed(filename, function (err, hash) {
      if (err) {
        return callback(err);
      }

      stat.hash = hash;
      self.cache.set(filename, mtime, stat);
      callback(null, stat, false);
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

  this.options.crypto(filename, once);
};
