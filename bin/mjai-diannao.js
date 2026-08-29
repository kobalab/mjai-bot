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

const outfile = argv.output && path.resolve(argv.output);

const rule = Majiang.rule();

const converter = require('../lib/convmsg');

const sock = net.connect(port, host, ()=>{

    const line = readline.createInterface(sock);

    let board = new Majiang.Board();
    const convmsg = converter(rule, board);

    let id;

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
            let cm = convmsg(msg);
        }

        if (msg.type == 'start_game') {
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
        else if (msg.type == 'chi' || msg.type == 'pon' ||
                 msg.type ==  'daiminkan')
        {
            if (msg.actor == id && msg.type != 'daiminkan') {
                reply = {
                    type: 'dahai',
                    actor: id,
                    pai: '',
                    tsumogiri: false
                };
                let p = board.shoupai[board.menfeng(id)].get_dapai().pop();
                let s = p[0], n = +p[1]||5;
                reply.pai = s == 'z' ? ['','E','S','W','N','P','F','C'][n]
                                     : n + s + (+p[1] ? '' : 'r');
            }
        }
        else if (msg.type == 'reach') {
            if (msg.actor == id) {
                reply = {
                    type: 'dahai',
                    actor: id,
                    pai: '',
                    tsumogiri: true
                };
                let p = Majiang.Game.allow_lizhi(
                                rule, board.shoupai[board.menfeng(id)]).pop();
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
