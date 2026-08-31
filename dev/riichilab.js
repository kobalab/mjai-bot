#!/usr/bin/env node

"use strict";

const Majiang = require('@kobalab/majiang-core');

const fs   = require('fs');
const path = require('path');

const WebSocket = require('ws');

const argv = require('yargs')
    .usage('Usage: $0')
    .option('token',   { alias: 't', type: 'string', demandOption: true })
    .option('output',  { alias: 'o'                })
    .option('legacy',  { alias: 'l', type: 'string'})
    .option('verbose', { alias: 'v', boolean: true })
    .option('debug',   { alias: 'D', boolean: true })
    .argv;

const outfile = argv.output && path.resolve(argv.output);

const token = fs.readFileSync(path.resolve(argv.token))
                                    .toString().replace(/\n$/,'');

const Player = argv.legacy ? require('@kobalab/majiang-ai/legacy')(argv.legacy)
                           : require('@kobalab/majiang-ai');

const url = 'wss://game.riichi.dev/ws/'
                + (argv.debug ? 'validate' : 'ranked');

const rule = Majiang.rule();

const converter = require('../lib/convmsg');
const convreply = require('../lib/convreply')();

const ws = new WebSocket(url, {
    headers: {
        Authorization: `Bearer ${token}`
    }
}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});

ws.on('open', ()=>{

    const player  = new Player();
    const convmsg = converter(rule);

    let reply;

    ws.on('message', (data)=>{
        let msg = JSON.parse(data);
        if (argv.verbose) console.log('<-', msg);

        if (msg.type == "error") {
            console.error(msg.message);
            if (outfile) fs.writeFileSync(outfile, JSON.stringify(convmsg()),
                                            'utf-8');
            process.exit(-1);
        }

        if (msg.type == 'request_action') {
            reply.request_id = msg.request_id;
            if (argv.verbose) console.log('->', reply);
            ws.send(JSON.stringify(reply) + '\n');
            return;
        }
        else if (msg.type == 'action_ack') {
            return;
        }

        let act = convmsg(msg);
        if (act && act.kaigang) {
            player.action(act);
            reply = convreply(msg);
        }
        else if (act) {
            player.action(act, (rep = {})=>{
                reply = convreply(msg, player._id, rep);
            });
        }
        else {
            reply = convreply(msg);
        }
    });

    ws.on('close', ()=>{
        if (outfile) fs.writeFileSync(outfile, JSON.stringify(convmsg()),
                                        'utf-8');
    });
});
