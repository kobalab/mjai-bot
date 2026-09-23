#!/usr/bin/env node

"use strict";

const Majiang = require('@kobalab/majiang-core');

const fs   = require('fs');
const path = require('path');
const util = require('util');

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

const convert = require('../lib/convert');

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
    const convreq = convert.convreq(rule);
    const convres = convert.convres();

    let res;

    ws.on('message', (data)=>{
        let req = JSON.parse(data);
        if (argv.verbose) console.log('<-', util.inspect(req,
                                                { depth: null, colors: true }));

        if (req.type == "error") {
            console.error(req.message);
            if (outfile) fs.writeFileSync(outfile, JSON.stringify(convreq()),
                                            'utf-8');
            process.exit(-1);
        }

        if (req.type == 'request_action') {
            res.request_id = req.request_id;
            if (argv.verbose) console.log('->', util.inspect(res,
                                                { depth: null, colors: true }));
            ws.send(JSON.stringify(res) + '\n');
            return;
        }
        else if (req.type == 'action_ack') {
            return;
        }
        if (req.type == 'start_kyoku') {
            if (player.model.qijia == null) player.model.qijia = req.oya;
        }

        let msg = convreq(req);
        if (msg && msg.kaigang) {
            player.action(msg);
            res = convres(req);
        }
        else if (msg) {
            player.action(msg, (rep = {})=>{
                res = convres(req, rep);
            });
        }
        else {
            res = convres(req);
        }

        if (req.type == 'end_game') {
            let paipu = convreq();
            let rank  = paipu.rank[player._id];
            let defen = `${paipu.defen[player._id]}`
                                    .replace(/(\d)(\d{3})$/,'$1,$2');
            console.log(`#${rank}: ${defen}`);
        }
    });

    ws.on('close', ()=>{
        if (outfile) fs.writeFileSync(outfile, JSON.stringify(convreq()),
                                        'utf-8');
    });
});
