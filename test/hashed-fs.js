'use strict';

var expect = require('chai').expect;
var hashed = require('../');
var node_path = require('path');
var fs = require('fs');
var tmp = require('tmp');


var root = node_path.join(__dirname, 'fixtures');
function file (f) {
  return node_path.join(root, f);
}

var HASH_a = 'ce2e532998ddb06b4334620d74e0d938';

describe("fs.stat()", function(){
  it("stat", function(done){
    hashed().stat(file('dir/b.js'), function (err, stat, hash, cached) {
      expect(err).to.equal(null);
      expect(hash).to.equal(HASH_a);
      done();
    });
  });

  it("stat cache", function(done){
    var h = hashed();
    var f = file('dir/cache.js');
    h.stat(f, function (err, stat, hash, cached) {
      expect(err).to.equal(null);
      expect(cached).to.equal(false);
      h.stat(f, function (err, stat, hash, cached) {
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
      expect(hash).to.equal(HASH_a);
      done();
    });
  });
});


describe("fs.writeFile()", function(){
  it("should write 2 files, with options.extra_write", function(done){
    tmp.dir(function (err, dir) {
      expect(err).to.equal(null);

      var dest = node_path.join(dir, 'a.js');
      var decorated_dest = node_path.join(dir, 'a-' + HASH_a.slice(0, 7) + '.js');
      hashed({
        extra_write: true
      }).writeFile(dest, '// a', function (err, hash) {
        expect(err).to.equal(null);
        expect(hash).to.equal(HASH_a);
        expect(fs.existsSync(dest)).to.equal(true);
        expect(fs.existsSync(decorated_dest)).to.equal(true);
        done()
      });
    });
  });

  it("should write 1 file, without options.extra_write", function(done){
    tmp.dir(function (err, dir) {
      expect(err).to.equal(null);

      var dest = node_path.join(dir, 'a.js');
      var decorated_dest = node_path.join(dir, 'a-' + HASH_a.slice(0, 7) + '.js');
      hashed().writeFile(dest, '// a', function (err, hash) {
        expect(err).to.equal(null);
        expect(hash).to.equal(HASH_a);
        expect(fs.existsSync(dest)).to.equal(false);
        expect(fs.existsSync(decorated_dest)).to.equal(true);
        done()
      });
    });
  });
});


describe("fs.copy()", function(){
  it("should copy 2 files", function(done){
    tmp.dir(function (err, dir) {
      expect(err).to.equal(null);

      var from = node_path.join(dir, 'a.js');
      fs.writeFileSync(from, '// a');

      var dest = node_path.join(dir, 'copy', 'a.js');
      var decorated_dest = node_path.join(dir, 'copy', 'a-' + HASH_a.slice(0, 7) + '.js');
      var hfs = hashed();
      hfs.copy(from, dest, function (err, hash) {
        expect(err).to.equal(null);
        expect(hash).to.equal(HASH_a);
        expect(fs.existsSync(dest)).to.equal(true);
        expect(fs.existsSync(decorated_dest)).to.equal(true);

        var map = hfs.cache.map();
        Object.keys(map).forEach(function (file) {
          var hash = map[file];
          expect(hash).to.equal(HASH_a);
        });

        done();
      });
    });
  });
});
