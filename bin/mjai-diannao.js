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

    line.on('line', (data)=>{
        let msg = JSON.parse(data);
        if (argv.verbose) console.log('<-', msg);

        let reply = { type: 'none' };

        if (msg.type == 'hello') {
            reply = { type: 'join', name: '電脳麻将', room: room };
        }
        else if (msg.type == "error") {
            console.error(msg.message);
            process.exit(-1);
        }
        else {
            let act = convmsg(msg);
            if (act) player.action(act);
        }

        if (msg.type == 'tsumo') {
            if (msg.actor == player._id) {
                reply = {
                    type: 'dahai',
                    actor: msg.actor,
                    pai: msg.pai,
                    tsumogiri: true
                };
            }
        }
        else if (msg.type == 'chi' || msg.type == 'pon' ||
                 msg.type ==  'daiminkan')
        {
            if (msg.actor == player._id && msg.type != 'daiminkan') {
                reply = {
                    type: 'dahai',
                    actor: msg.actor,
                    pai: '',
                    tsumogiri: false
                };
                let p = player.shoupai.get_dapai().pop();
                let s = p[0], n = +p[1]||5;
                reply.pai = s == 'z' ? ['','E','S','W','N','P','F','C'][n]
                                     : n + s + (+p[1] ? '' : 'r');
            }
        }
        else if (msg.type == 'reach') {
            if (msg.actor == player._id) {
                reply = {
                    type: 'dahai',
                    actor: msg.actor,
                    pai: '',
                    tsumogiri: true
                };
                let p = Majiang.Game.allow_lizhi(rule, player.shoupai).pop();
                let s = p[0], n = +p[1]||5;
                reply.pai = s == 'z' ? ['','E','S','W','N','P','F','C'][n]
                                     : n + s + (+p[1] ? '' : 'r');
                reply.tsumogiri = p[2] == '_';
            }
        }

        if (msg.possible_actions && msg.possible_actions.length)
                                            reply = msg.possible_actions[0];

        if (argv.verbose) console.log('->', reply);
        sock.write(JSON.stringify(reply) + '\n');
    });
    sock.on('close', ()=>{
        if (outfile) fs.writeFileSync(outfile, JSON.stringify(convmsg()),
                                        'utf-8');
    });

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
