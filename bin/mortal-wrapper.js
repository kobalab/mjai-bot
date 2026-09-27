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

    function fixreq(data) {
        let req = JSON.parse(data);

        if (req.type == 'hello') {
            if (argv.verbose) console.log('<-', util.inspect(req,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
            let res = { type: 'join', name: name, room: room };
            if (argv.verbose) console.log('->', util.inspect(res,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
            sock.write(JSON.stringify(res) + '\n');
            return;
        }
        else if (req.type == 'start_game') {
            id = req.id;
            if (! argv.akagi) {
                if (argv.verbose) console.log('<-', util.inspect(req,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
                bot = exec_mortal(id);
                readline.createInterface(bot.stdout).on('line', fixres);
                let res = { type: 'none' };
                if (argv.verbose) console.log('->', util.inspect(res,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
                sock.write(JSON.stringify(res) + '\n');
                return;
            }
        }
        else if (req.type == 'start_kyoku') {
            if (! req.scores) req.scores = scores;
        }
        else if (req.type == 'error') {
            console.error(req.message);
            process.exit(-1);
        }

        if (argv.verbose) console.log('<-', util.inspect(req,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
        if (argv.akagi) bot.stdin.write(JSON.stringify([ req ]) + '\n');
        else            bot.stdin.write(JSON.stringify(req) + '\n');

        if (req.scores) scores = req.scores;
        if (req.pai)    pai    = req.pai;

        if (req.type == 'end_game') {
            if (! argv.akagi) bot.kill('SIGINT');
        }
    }

    function fixres(data) {
        let res = JSON.parse(data);

        if (res.type == 'hora') {
            res.pai = pai;
        }
        else if (res.type == 'ryukyoku') {
            res.actor = id;
            res.reason = 'kyushukyuhai';
        }
        delete res.meta;

        if (argv.verbose) console.log('->', util.inspect(res,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
        sock.write(JSON.stringify(res) + '\n');
    }

    if (argv.akagi) {
        bot = exec_akagi();
        readline.createInterface(bot.stdout).on('line', fixres);
    }

    readline.createInterface(sock).on('line', fixreq);

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
