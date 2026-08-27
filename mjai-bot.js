#!/usr/bin/env node

"use strict";

const net = require('net');

const host = process.argv[3]   || 'localhost';
const port = + process.argv[2] || 11600;

const sock = net.connect(port, host, ()=>{
    sock.on('data', (data)=>{
        let msg = JSON.parse(data.toString('utf-8'));
        console.log('<-', msg);

        let reply = { type: 'none' };
        console.log('->', reply);
        sock.write(JSON.stringify(reply) + '\n');
    });
});
