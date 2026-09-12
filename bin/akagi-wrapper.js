#!/usr/bin/env node

"use strict";

const path      = require('path');
const net       = require('net');
const readline  = require('readline');
const { spawn } = require('child_process');
const util      = require('util');

const argv = require('yargs')
    .usage('Usage: $0 mjsonp://<host>:<port>/<room> akagi-dir')
    .option('verbose', { alias: 'v', boolean: true })
    .demandCommand(2)
    .argv;

const [ , host, port, room ]
            = argv._[0].match(/^mjsonp:\/\/(.+):(\d+)\/([^\/]+)/) || [];
if (! host) {
    console.error(`Error: ${argv._[0]} is bad URL.`);
    process.exit(-1);
}

const workdir = path.resolve(argv._[1]);

const akagi = spawn('uv', ['run','python','bot.py'],
                        { cwd:   workdir,
                          stdio: ['pipe', 'pipe', 'inherit'] });

const sock = net.connect(port, host, ()=>{

    const line = readline.createInterface(sock);

    let id, pai, scores = [ 25000, 25000, 25000, 25000 ];

    line.on('line', (data)=>{
        let msg = JSON.parse(data);
        if (argv.verbose) console.log('<-', util.inspect(msg,
                                            { depth: null, colors: true }));

        if (msg.type == 'hello') {
            let rep = { type: 'join', name: 'Akagi', room: room };
            if (argv.verbose) console.log('->', util.inspect(rep,
                                                { depth: null, colors: true }));
            sock.write(JSON.stringify(rep) + '\n');
            return;
        }
        else if (msg.type == 'start_game') {
            id = msg.id;
        }
        else if (msg.type == 'start_kyoku') {
            if (! msg.scores) msg.scores = scores;
        }
        else if (msg.type == 'error') {
            console.error(msg.message);
            process.exit(-1);
        }

        akagi.stdin.write(JSON.stringify([ msg ]) + '\n');

        if (msg.scores) scores = msg.scores;
        if (msg.pai)    pai    = msg.pai;
    });

    const stdin = readline.createInterface(akagi.stdout);

    stdin.on('line', (data)=>{
        let rep = JSON.parse(data);

        if (rep.type == 'hora') {
            rep.pai = pai;
        }
        else if (rep.type == 'ryukyoku') {
            rep.actor = id;
            rep.reason = 'kyushukyuhai';
        }
        delete rep.meta;

        if (argv.verbose) console.log('->', util.inspect(rep,
                                            { depth: null, colors: true }));
        sock.write(JSON.stringify(rep) + '\n');
    });

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
