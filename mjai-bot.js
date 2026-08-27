#!/usr/bin/env node

"use strict";

const net = require('net');

const host = process.argv[3]   || 'localhost';
const port = + process.argv[2] || 11600;

const sock = net.connect(port, host);
