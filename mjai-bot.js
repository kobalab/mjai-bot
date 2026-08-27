#!/usr/bin/env node

"use strict";

const net = require('net');

const host = process.argv[3]   || 'localhost';
const port = + process.argv[2] || 11600;

const sock = net.connect(port, host, ()=>{

    let id;

    sock.on('data', (data)=>{
        let msg = JSON.parse(data.toString('utf-8'));
        console.log('<-', msg);

        let reply = { type: 'none' };

        if (msg.type == 'hello') {
            reply = { type: 'join', name: 'mjai-bot', room: 'default' };
        }
        else if (msg.type == 'start_game') {
            id = msg.id;
        }
        else if (msg.type == 'tsumo') {
            if (msg.actor == id) {
                reply = {
                    type: 'dahai',
                    actor: id,
                    pai: msg.pai,
                    tsumogiri: true
                };
            }
        }
        console.log('->', reply);
        sock.write(JSON.stringify(reply) + '\n');
    });
});
