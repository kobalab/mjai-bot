#!/usr/bin/env node

"use strict";

const fs   = require('fs');
const path = require('path');

const net = require('net');

const host = process.argv[3]   || 'localhost';
const port = + process.argv[2] || 11600;

const outfile = process.argv[4] && path.resolve(process.argv[4]);

const sock = net.connect(port, host, ()=>{

    let id, paipu = {};

    sock.on('data', (data)=>{
        let msg = JSON.parse(data.toString('utf-8'));
        console.log('<-', msg);

        let reply = { type: 'none' };

        if (msg.type == 'hello') {
            reply = { type: 'join', name: 'mjai-bot', room: 'default' };
        }
        else if (msg.type == 'start_game') {
            id = msg.id;
            paipu = {
                title:  'Mjai',
                player: msg.names.concat(),
                qijia:  0,
                log:    [],
                defen:  [ 25000, 25000, 25000, 25000 ],
                rank:   [],
                point:  []
            };
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
    sock.on('close', ()=>{
        fs.writeFileSync(outfile, JSON.stringify(paipu), 'utf-8');
    });
});
