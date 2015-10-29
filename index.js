'use strict';

module.exports = hashed;

var crypto = require('crypto');
var fs = require('fs');
var node_path = require('path');

var fse = require('fs-extra');
var make_array = require('make-array');
var wrap = require('wrap-as-async');

var cache = require('./lib/cache');

function crypto (filename) {
  var done = this.async();

  var md5 = crypto.createHash('md5');
  var rs = fs.createReadStream(filename);
  .on('data', function (data) {
    md5.update(data);
  })
  .on('error', done);
  .on('end', function () {
    var hash = md5.digest('hex');
    done(null, hash);
  });
}

// @param {Object} options
// - cache_file: `path` the cache to save the hashes
// - crypto: `function()`
function Hashed (options) {
  this.options = options;
  this.options.crypto = wrap(options.options.crypto || crypto);
}

Hashed.cache = {};

// @param {function(err, data, file_hash)}
Hashed.prototype.readFile = function(filename, callback) {
  
};


// @param {function(exists, file_hash)}
Hashed.prototype.exists = function(filename, callback) {
  // body...
};


// @param {function(err, file_hash)}
Hashed.prototype.copy = function(filename, dest_dir, callback) {
  // body...
};


Hashed.prototype.stat = function(filename, callback) {
  fs.stat(filename, function (err, stat) {
    if (err) {
      return callback(err);
    }

    this._dealStat()

  }.bind(this));
};


Hashed.prototype._dealStat = function() {
  // body...
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


var STR_NOT_FOUND = 'NOT_FOUND';

// @private
Hashed.prototype._initCache = function(filename, callback) {
  filename = node_path.resolve(filename);
  fs.exists(filename, function (exists) {
    if (!exists) {
      
      return callback(STR_NOT_FOUND);
    }

    fs.stat(filename, function (err, stat) {
      if (err) {
        return callback(err);
      }

      
    });
  });
};


['readFile', 'exists', 'copy', 'stat'].forEach(function (name) {
  var method = Hashed.prototype[name];
  Hashed.prototype[name] = function () {
    var args = make_array(arguments);
    var callback = args[args.length - 1];
    var filename = args[0];

    this._initCache(filename, function (err, info) {
      if (err) {
        return callback(err);
      }
    });
  }
});
