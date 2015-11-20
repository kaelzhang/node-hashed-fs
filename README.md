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

In comparison with the corresponding vanilla `fs` method, each hashed-fs method has an additional parameter `hash` of the callback function, which is the encrypted hash of the file content.

### options.crypto `function(data)`

This method is an iterator handler. The chunks of the file content, i.e, `data`, will be passed into `options.crypto` one by one. `data` has the structure below:

```js
{
  value: <Buffer|String>, // the chunk of data
  done: <true|false>      // whether is the last chunk of data
}
```

If `data.done` is `true`, it means the last chunk of data received, and the `options.crypto` should return the encrypted result.

### hfs.readFile(filename, callback)

```js
hfs.readFile('/path/to/a.js', function(err, content, hash){
  content;  // '// a'
  hash;     // 'ce2e532998ddb06b4334620d74e0d938'
});
```

- **callback** `function(err, content, hash)`
  - `content` ``
  - `hash` the `options.crypo()`d hash according to the file content.

Reads the file content, and get the stat.

### hfs.copy(filename, dest, callback, force)

- **callback** `function(err, hash)`

Copies the file of `filename` to `dest` along with the hash-decorated `dest`.

If the file is already in the cache, it will skip copying, except that `force` is `true`.

```js
hfs.copy('/path/to/a.js', '/dest/to', function(err, hash){
  hash; // 'ce2e532998ddb06b4334620d74e0d938'
});
```

Then the `/dest/to` folder will have **TWO** files:

```sh
/dest/to
       | -- a.js
       | -- a-ce2e532.js
```

`ce2e532` is the first seven charactors of the `hash`. By changing the default `options.decorate` method, you could define your custom pathname to the destination.


### hfs.stat(filename, callback)

- **callback** `function(err, stat, hash, cached)`
  - `stat` [`fs.Stats`](https://nodejs.org/api/fs.html#fs_class_fs_stats) is the file status of the file
  - `cached` `Boolean` whether has read from cache.

Gets the file stat, and the hashed result.


### hfs.writeFile(filename, content, callback)

Similar to `hfs.copy()`, this method will write **TWO** files


## License

MIT
