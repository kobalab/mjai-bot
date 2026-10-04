#!/usr/bin/env node

"use strict";

const path     = require('path');
const net      = require('net');
const readline = require('readline');
const util     = require('util');
const { execFile } = require('child_process');

const argv = require('yargs')
    .usage('Usage: $0 mjsonp://<host>:<port>/<room> akochan-dir')
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

const name = 'Akochan';

const server = net.connect(port, host, ()=>{

    const wrapper = net.createServer((bot)=>{

        function request(data) {
            let req = JSON.parse(data);
            if (argv.verbose) console.log('<-', util.inspect(req,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
            if (req.type == 'error') {
                console.error(req.message);
                process.exit(-1);
            }

            bot.write(data + '\n');

            if (req.type == 'end_game') {
                process.exit();
            }
        }
        readline.createInterface(server).on('line', request);

        function response(data) {
            let res = JSON.parse(data);
            if (argv.verbose) console.log('->', util.inspect(res,
                                            { depth: null,
                                              colors: process.stdout.isTTY }));
            server.write(data + '\n');
        }
        readline.createInterface(bot).on('line', response);
        bot.on('close', ()=> process.exit());

    }).listen(()=>{
        execFile('./system.exe', ['mjai_client', wrapper.address().port],
                                { cwd: workdir,
                                  env: { ...process.env,
                                         LD_LIBRARY_PATH: '.' } } )
            .on('error', (e)=>{
                console.error(e.toString());
                process.exit(-1);
            });
    });

}).on('error', (e)=>{
    console.error((e.errors?.[0] ?? e).toString());
    process.exit(-1);
});
