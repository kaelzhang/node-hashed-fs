#!/usr/bin/env node

'use strict';

var node_path = require('path');
var cache = require('../../lib/cache');
var argv = require('minimist')(process.argv.slice(2))

var c = cache(argv.file);

c.ready(function () {
  
});