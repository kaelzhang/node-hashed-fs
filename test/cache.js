'use strict';

var expect = require('chai').expect;
var hashed = require('../');
var node_path = require('path');
var spawns = require('spawns');
var once = require('once');

var command_file = node_path.join(__dirname, 'bin', 'cache.js')

function s (dir, callback) {
  var cb = once(callback);
  spawns(['node ' + command_file + '  --file ' ]).on('close', function () {
    
  })
}

describe("description", function(){
  // code ...
});