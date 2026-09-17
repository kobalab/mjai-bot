#!/usr/bin/env node

"use strict";

const path      = require('path');
const net       = require('net');
const readline  = require('readline');
const util      = require('util');
const { spawn } = require('child_process');

const argv = require('yargs')
    .usage('Usage: $0 mjsonp://<host>:<port>/<room> mortal-dir')
    .option('verbose', { alias: 'v', boolean: true })
    .option('akagi',   {             boolean: true })
    .demandCommand(2)
    .argv;

const [ , host, port, room ]
            = argv._[0].match(/^mjsonp:\/\/(.+):(\d+)\/([^\/]+)/) || [];
if (! host) {
    console.error(`Error: ${argv._[0]} is bad URL.`);
    process.exit(-1);
}

const workdir = argv.akagi ? path.resolve(argv._[1])
                           : path.join(path.resolve(argv._[1]), 'mortal');

const name = argv.akagi ? 'Akagi' : 'Mortal';

function exec_mortal(id) {
    return spawn('uv', ['run','python','mortal.py', id],
                    { cwd:   workdir,
                      env:   {  ...process.env,
                                MORTAL_REVIEW_MODE: 1 },
                      stdio: ['pipe','pipe','inherit'] });
}

function exec_akagi() {
    return spawn('uv', ['run','python','bot.py'],
                    { cwd:   workdir,
                      stdio: ['pipe','pipe','inherit'] });
}

const sock = net.connect(port, host, ()=>{

    let bot, id, pai, scores = [ 25000, 25000, 25000, 25000 ];

    function fixmsg(data) {
        let msg = JSON.parse(data);

        if (msg.type == 'hello') {
            if (argv.verbose) console.log('<-', util.inspect(msg,
                                            { depth: null, colors: true }));
            let rep = { type: 'join', name: name, room: room };
            if (argv.verbose) console.log('->', util.inspect(rep,
                                                { depth: null, colors: true }));
            sock.write(JSON.stringify(rep) + '\n');
            return;
        }
        else if (msg.type == 'start_game') {
            id = msg.id;
            if (! argv.akagi) {
                if (argv.verbose) console.log('<-', util.inspect(msg,
                                                { depth: null, colors: true }));
                bot = exec_mortal(id);
                readline.createInterface(bot.stdout).on('line', fixrep);
                let rep = { type: 'none' };
                if (argv.verbose) console.log('->', util.inspect(rep,
                                                { depth: null, colors: true }));
                sock.write(JSON.stringify(rep) + '\n');
                return;
            }
        }
        else if (msg.type == 'start_kyoku') {
            if (! msg.scores) msg.scores = scores;
        }
        else if (msg.type == 'error') {
            console.error(msg.message);
            process.exit(-1);
        }

        if (argv.verbose) console.log('<-', util.inspect(msg,
                                            { depth: null, colors: true }));
        if (argv.akagi) bot.stdin.write(JSON.stringify([ msg ]) + '\n');
        else            bot.stdin.write(JSON.stringify(msg) + '\n');

        if (msg.scores) scores = msg.scores;
        if (msg.pai)    pai    = msg.pai;

        if (msg.type == 'end_game') {
            if (! argv.akagi) bot.kill('SIGINT');
        }
    }

    function fixrep(data) {
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
    }

    if (argv.akagi) {
        bot = exec_akagi();
        readline.createInterface(bot.stdout).on('line', fixrep);
    }

    readline.createInterface(sock).on('line', fixmsg);

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
