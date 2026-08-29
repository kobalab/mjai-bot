#!/usr/bin/env node

"use strict";

const Majiang = require('@kobalab/majiang-core');

const fs       = require('fs');
const path     = require('path');
const net      = require('net');
const readline = require('readline');

const argv = require('yargs')
    .usage('Usage: $0 mjsonp://<host>:<port>/<room>')
    .option('output',  { alias: 'o'                })
    .option('verbose', { alias: 'v', boolean: true })
    .demandCommand(1)
    .argv;

let [ , host, port, room ]
            = argv._[0].match(/^mjsonp:\/\/(.+):(\d+)\/([^\/]+)/) || [];
if (! host) {
    console.error(`Error: ${argv._[0]} is bad URL.`);
    process.exit(-1);
}

const Player = require('@kobalab/majiang-ai');

const outfile = argv.output && path.resolve(argv.output);

const rule = Majiang.rule();

const converter = require('../lib/convmsg');

const sock = net.connect(port, host, ()=>{

    const line = readline.createInterface(sock);

    const player  = new Player();
    const convmsg = converter(rule);

    let next_reply;

    line.on('line', (data)=>{
        let msg = JSON.parse(data);
        if (argv.verbose) console.log('<-', msg);

        let reply = { type: 'none' };

        if (msg.type == 'hello') {
            reply = { type: 'join', name: '電脳麻将', room: room };
        }
        else if (msg.type == 'reach' && next_reply) {
            reply = next_reply;
            next_reply = null;
        }
        else if (msg.type == "error") {
            console.error(msg.message);
            process.exit(-1);
        }

        let act = convmsg(msg);
        if (act && act.kaigang) {
            player.action(act);
            if (argv.verbose) console.log('->', reply);
            sock.write(JSON.stringify(reply) + '\n');
        }
        else if (act) {
            player.action(act, (rep = {})=>{
                if (rep.dapai) {
                    let p = rep.dapai;
                    reply = { type: 'dahai', actor: msg.actor,
                              pai: '', tsumogiri: false };
                    let s = p[0], n = +p[1]||5;
                    reply.pai = s == 'z' ? ['','E','S','W','N','P','F','C'][n]
                                         : n + s + (+p[1] ? '' : 'r');
                    reply.tsumogiri = p[2] == '_';
                    if (p.slice(-1) == '*') {
                        next_reply = reply;
                        reply = { type: 'reach', actor: msg.actor };
                    }
                }
                else if (rep.hule) {
                    reply = { type: 'hora', actor: player._id,
                              target: msg.actor, pai: msg.pai };
                }
                if (argv.verbose) console.log('->', reply);
                sock.write(JSON.stringify(reply) + '\n');
            });
        }
        else {
            if (argv.verbose) console.log('->', reply);
            sock.write(JSON.stringify(reply) + '\n');
        }
    });
    sock.on('close', ()=>{
        if (outfile) fs.writeFileSync(outfile, JSON.stringify(convmsg()),
                                        'utf-8');
    });

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
