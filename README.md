[![Build Status](https://travis-ci.org/kaelzhang/node-hashed-fs.svg?branch=master)](https://travis-ci.org/kaelzhang/node-hashed-fs)
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/hashed-fs.svg)](http://badge.fury.io/js/hashed-fs)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/hashed-fs.svg)](https://www.npmjs.org/package/hashed-fs)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/node-hashed-fs.svg)](https://david-dm.org/kaelzhang/node-hashed-fs)
-->

# hashed-fs

Manipulate file with cached content hash.

## Install

```sh
$ npm install hashed-fs --save
```

## Usage

```js
var hfs = require('hashed-fs')(options);
```

- **options** `Object`
  - crypto: `function()` method to crypto a file into a `hash`
  - decorate: `function()` method to decorate the destination filename by flavoring with file `hash`. It can be synchronous methods or asynchronous ones by using the common [`this.async()`](https://www.npmjs.com/package/wrap-as-async) style.

### options.crypto `function(data)`

This method is an iterator handler. The chunks of the file content, i.e, `data`, will be passed into `options.crypto` one by one. `data` has the structure below:

```js
{
  value: <Buffer|String>, // the chunk of data
  done: <true|false>      // whether is the last chunk of data
}
```

If `data.done` is `true`, it means the last chunk of data received, and the `options.crypto` should return the crypted result.

### hfs.readFile(filename, callback)

- **callback** `function(err, content, hash)`
  - `content` ``
  - `hash` the `options.crypo()`d hash according to the file content.

Reads the file content, and get the stat.

### hfs.copy(filename, dest, callback, force)

- **callback** `function(err, hash)`

Copies the file of `filename` to `dest` along with the hash-decorated `dest`.

If the file is already in the cache, it will skip copying, except that `force` is `true`.


### hfs.stat(filename, callback)

- **callback** `function(err, stat, hash, cached)`
  - `stat` [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) is the file status of the file
  - `cached` `Boolean` whether has read from cache.

Gets the file stat, and the hashed result.

## License

MIT
