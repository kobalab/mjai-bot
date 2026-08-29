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
const convreply = require('../lib/convreply')();

const sock = net.connect(port, host, ()=>{

    const line = readline.createInterface(sock);

    const player  = new Player();
    player.select_gang = ()=>{};
    const convmsg = converter(rule);

    line.on('line', (data)=>{
        let msg = JSON.parse(data);
        if (argv.verbose) console.log('<-', msg);

        if (msg.type == 'hello') {
            let reply = { type: 'join', name: '電脳麻将', room: room };
            if (argv.verbose) console.log('->', reply);
            sock.write(JSON.stringify(reply) + '\n');
            return;
        }
        if (msg.type == "error") {
            console.error(msg.message);
            process.exit(-1);
        }

        let act = convmsg(msg);
        if (act && act.kaigang) {
            player.action(act);
            let reply = convreply(msg);
            if (argv.verbose) console.log('->', reply);
            sock.write(JSON.stringify(reply) + '\n');
        }
        else if (act) {
            player.action(act, (rep = {})=>{
                let reply = convreply(msg, player._id, rep);
                if (argv.verbose) console.log('->', reply);
                sock.write(JSON.stringify(reply) + '\n');
            });
        }
        else {
            let reply = convreply(msg);
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
