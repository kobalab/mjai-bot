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

const convert = require('../lib/convert');

const name = argv.legacy ? `電脳麻将[${argv.legacy}]` : '電脳麻将'

const sock = net.connect(port, host, ()=>{

    const line = readline.createInterface(sock);

    const player  = new Player();
    const convreq = convert.convreq(rule);
    const convres = convert.convres();

    function send(rep) {
        if (argv.verbose) console.log('->', util.inspect(rep,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
        sock.write(JSON.stringify(rep) + '\n');
    }

    line.on('line', (data)=>{
        let req = JSON.parse(data);
        if (argv.verbose) console.log('<-', util.inspect(req,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));

        if (req.type == 'hello') {
            send({ type: 'join', name: name, room: room });
            return;
        }
        if (req.type == "error") {
            console.error(req.message);
            if (outfile) fs.writeFileSync(outfile, JSON.stringify(convreq()),
                                            'utf-8');
            process.exit(-1);
        }
        if (req.type == 'start_kyoku') {
            if (player.model.qijia == null) player.model.qijia = req.oya;
        }

        let msg = convreq(req);
        if (msg && msg.kaigang) {
            player.action(msg);
            send(convres(req));
        }
        else if (msg) {
            player.action(msg, (rep = {})=>{
                send(convres(req, rep));
            });
        }
        else {
            send(convres(req));
        }
    });
    sock.on('close', ()=>{
        if (outfile) fs.writeFileSync(outfile, JSON.stringify(convreq()),
                                        'utf-8');
    });

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
