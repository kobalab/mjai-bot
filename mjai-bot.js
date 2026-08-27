#!/usr/bin/env node

"use strict";

const fs   = require('fs');
const path = require('path');

const net = require('net');

const host = process.argv[3]   || 'localhost';
const port = + process.argv[2] || 11600;

const outfile = process.argv[4] && path.resolve(process.argv[4]);

const Majiang = require('@kobalab/majiang-core');

function pai(p) {
    if (p == '?') return '';
    if (p.length == 1) return 'z' + { E:1, S:2, W:3, N:4, P:5, F:6, C:7 }[p];
    let n = + p[0], s = p[1];
    return s + (p[2] == 'r' ? 0 : n);
}

const sock = net.connect(port, host, ()=>{

    let id, paipu = {},
        board = new Majiang.Board(),
        lunban, lizhi;

    sock.on('data', (data)=>{
        let msg = JSON.parse(data.toString('utf-8'));
        console.log('<-', msg);

        let reply = { type: 'none' };

        if (msg.type == 'hello') {
            reply = { type: 'join', name: 'mjai-bot', room: 'default' };
        }
        else if (msg.type == 'start_game') {
            id = msg.id;
            paipu = {
                title:  'Mjai',
                player: msg.names.concat(),
                qijia:  0,
                log:    [],
                defen:  [ 25000, 25000, 25000, 25000 ],
                rank:   [],
                point:  []
            };
            let kaiju = {
                id:     msg.id,
                rule:   Majiang.rule(),
                title:  paipu.title,
                player: msg.names.concat(),
                qijia:  paipu.qijia
            };
            board.kaiju(kaiju);
        }
        else if (msg.type == 'start_kyoku') {
            let qipai = {
                zhuangfeng: { E:0, S:1, W:2, N:3 }[msg.bakaze],
                jushu:      msg.kyoku - 1,
                changbang:  msg.honba,
                lizhibang:  msg.kyotaku,
                defen:      paipu.defen.concat(),
                baopai:     pai(msg.dora_marker),
                shoupai:    ['', '','',''],
            };
            lunban = [];
            for (let id = 0; id < 4; id++) {
                lunban[id] = (4 - paipu.qijia + 4 - qipai.jushu + id) % 4;
                qipai.shoupai[lunban[id]]
                        = msg.tehais[id].map(p => pai(p)).join('');
            }
            lizhi = false;
            paipu.log.push([ { qipai: qipai } ]);
            board.qipai(qipai);
        }
        else if (msg.type == 'tsumo') {
            let zimo = { l: lunban[msg.actor], p: pai(msg.pai)};
            paipu.log[paipu.log.length - 1].push({ zimo: zimo });
            board.zimo(zimo);
            if (msg.actor == id) {
                reply = {
                    type: 'dahai',
                    actor: id,
                    pai: msg.pai,
                    tsumogiri: true
                };
            }
        }
        else if (msg.type == 'dahai') {
            let dapai = { l: lunban[msg.actor],
                          p: pai(msg.pai) + (msg.tsumogiri ? '_' : '')
                                          + (lizhi         ? '*' : '')};
            paipu.log[paipu.log.length - 1].push({ dapai: dapai });
            board.dapai(dapai);
        }
        else if (msg.type == 'reach') {
            lizhi = true;
        }
        else if (msg.type == 'reach_accepted') {
            lizhi = false;
        }
        else if (msg.type == 'hora') {
            let fenpei = [];
            for (let id = 0; id < 4; id++) {
                fenpei[lunban[id]] = msg.deltas[id];
            }
            let hule = {
                l:        lunban[msg.actor],
                shoupai:  msg.hora_tehais.map(p => pai(p)).join(''),
                baojia:   msg.actor == msg.target ? null : lunban[msg.target],
                fubaopai: msg.uradora_markers.length
                                ? msg.uradora_markers.map(p => pai(p))
                                : undefined,
                fu:       msg.fu,
                fanshu:   msg.fan,
                defen:    msg.hora_points,
                hupai:    msg.yakus.map(h =>({ name: h[0], fanshu: h[1] })),
                fenpei:   fenpei
            };
            if (hule.baojia != null) hule.shoupai += pai(msg.pai);

            paipu.log[paipu.log.length - 1].push({ hule: hule });
        }
        console.log('->', reply);
        sock.write(JSON.stringify(reply) + '\n');
    });
    sock.on('close', ()=>{
        if (outfile) fs.writeFileSync(outfile, JSON.stringify(paipu), 'utf-8');
    });
});
