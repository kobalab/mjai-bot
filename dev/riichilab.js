#!/usr/bin/env node

"use strict";

const fs   = require('fs');
const path = require('path');

const WebSocket = require('ws');

const argv = require('yargs')
    .usage('Usage: $0')
    .option('output',  { alias: 'o'                })
    .option('verbose', { alias: 'v', boolean: true })
    .argv;

const token = fs.readFileSync(path.resolve('.riichilab'))
                                    .toString().replace(/\n$/,'');

const ws = new WebSocket('wss://game.riichi.dev/ws/validate', {
    headers: {
        Authorization: `Bearer ${token}`
    }
});

ws.on('open', ()=>{
    console.log('** connect');

    ws.on('message', (data)=>{
        console.log('** data:', JSON.parse(data.toString('utf-8')));
    });
});
