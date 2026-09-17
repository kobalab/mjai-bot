#!/usr/bin/env node

"use strict";

const Majiang = require('@kobalab/majiang-core');

const fs       = require('fs');
const path     = require('path');
const net      = require('net');
const readline = require('readline');
const util     = require('util');

const argv = require('yargs')
    .usage('Usage: $0 mjsonp://<host>:<port>/<room>')
    .option('output',  { alias: 'o'                })
    .option('legacy',  { alias: 'l', type: 'string'})
    .option('verbose', { alias: 'v', boolean: true })
    .demandCommand(1)
    .argv;

let [ , host, port, room ]
            = argv._[0].match(/^mjsonp:\/\/(.+):(\d+)\/([^\/]+)/) || [];
if (! host) {
    console.error(`Error: ${argv._[0]} is bad URL.`);
    process.exit(-1);
}

const Player = argv.legacy ? require('@kobalab/majiang-ai/legacy')(argv.legacy)
                           : require('@kobalab/majiang-ai');

const outfile = argv.output && path.resolve(argv.output);

const rule = Majiang.rule();

const converter = require('../lib/convmsg');
const convreply = require('../lib/convreply')();

const name = argv.legacy ? `電脳麻将[${argv.legacy}]` : '電脳麻将'

const sock = net.connect(port, host, ()=>{

    const line = readline.createInterface(sock);

    const player  = new Player();
    const convmsg = converter(rule);

    function send(reply) {
        if (argv.verbose) console.log('->', util.inspect(reply,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
        sock.write(JSON.stringify(reply) + '\n');
    }

    line.on('line', (data)=>{
        let msg = JSON.parse(data);
        if (argv.verbose) console.log('<-', util.inspect(msg,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));

        if (msg.type == 'hello') {
            send({ type: 'join', name: name, room: room });
            return;
        }
        if (msg.type == "error") {
            console.error(msg.message);
            if (outfile) fs.writeFileSync(outfile, JSON.stringify(convmsg()),
                                            'utf-8');
            process.exit(-1);
        }
        if (msg.type == 'start_kyoku') {
            if (player.model.qijia == null) player.model.qijia = msg.oya;
        }

        let act = convmsg(msg);
        if (act && act.kaigang) {
            player.action(act);
            send(convreply(msg));
        }
        else if (act) {
            player.action(act, (rep = {})=>{
                send(convreply(msg, player._id, rep));
            });
        }
        else {
            send(convreply(msg));
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
