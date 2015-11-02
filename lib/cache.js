'use strict';

var access = require('object-access');

var cache = {};

exports.set = function (filename, mtime, info) {
  access.set(cache, [filename, mtime], info);
};


exports.get = function (filename, mtime) {
  return access(cache, [filename, mtime]);
};


exports.remove = function (filename) {
  access.remove(cache, [filename]);
};



