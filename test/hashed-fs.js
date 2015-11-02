'use strict';

var expect = require('chai').expect;
var hashed = require('../');
var node_path = require('path');

var root = node_path.join(__dirname, 'fixtures');
function file (f) {
  return node_path.join(root, f);
}

var HASH_a = 'ce2e532';

describe("fs.stat()", function(){
  it("stat", function(done){
    hashed().stat(file('dir/b.js'), function (err, stat, cached) {
      expect(err).to.equal(null);
      expect(stat.hash).to.equal(HASH_a);
      done();
    });
  });

  it("stat cache", function(done){
    var h = hashed();
    var f = file('dir/cache.js');
    h.stat(f, function (err, stat, cached) {
      expect(err).to.equal(null);
      expect(cached).to.equal(false);
      h.stat(f, function (err, stat, cached) {
        expect(err).to.equal(null);
        expect(cached).to.equal(true);
        done();
      })
    });
  });
});


describe("fs.readFile()", function(){
  it("readFile", function(done){
    hashed().readFile(file('dir/a.js'), function (err, content, hash) {
      expect(err).to.equal(null);
      expect(content.toString()).to.equal('// a');
      expect(hash.hash).to.equal(HASH_a);
      done();
    });
  });
});
