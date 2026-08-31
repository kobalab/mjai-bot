/*
 *  convmsg
 */
"use strict";

const Majiang = require('@kobalab/majiang-core');

function pai(p) {
    if (p == '?') return '';
    if (p.length == 1) return 'z' + { E:1, S:2, W:3, N:4, P:5, F:6, C:7 }[p];
    let n = + p[0], s = p[1];
    return s + (p[2] == 'r' ? 0 : n);
}

function mianzi(l, t, ...p) {
    let d = ['','+','=','-'][(4 + t - l) % 4];
    return Majiang.Shoupai.valid_mianzi(
                p.map(p => pai(p)).join('').replace(/(?<=\d)[mpsz]/g,'') + d);
}

function make_rank(paipu) {

    let paiming = [];
    let defen = paipu.defen;
    for (let i = 0; i < 4; i++) {
        let id = (paipu.qijia + i) % 4;
        for (let j = 0; j < 4; j++) {
            if (j == paiming.length || defen[id] > defen[paiming[j]]) {
                paiming.splice(j, 0, id);
                break;
            }
        }
    }

    let rank = [0,0,0,0];
    for (let i = 0; i < 4; i++) {
        rank[paiming[i]] = i + 1;
    }
    return rank;
}

function make_point(paipu, rule) {

    const round = ! rule['順位点'].find(p=>p.match(/\.\d$/));
    let point = [0,0,0,0];
    let top;
    for (let id = 0; id < 4; id++) {
        if (paipu.rank[id] == 1) {
            top = id;
            continue;
        }
        point[id] = (paipu.defen[id] - 30000) / 1000
                  + + rule['順位点'][paipu.rank[id] - 1];
        if (round) point[id] = Math.round(point[id]);
    }
    point[top] = - point.reduce((x, y)=> x + y);
    return point.map(p => p.toFixed(round ? 0 : 1));

}

function gameno(board) {
    return ['東','南','西','北'][board.zhuangfeng]
         + ['一','二','三','四'][board.jushu] + '局'
         + `${board.changbang}本場`
}

module.exports = function(rule){

    let id, paipu, lunban, lizhi, all_fulou;

    return function(msg) {

        if (! msg) return paipu;

        if (msg.type == 'start_game') {

            id = msg.id;

            let player = ['私','下家','対面','上家'];
            player = player.splice(id).concat(player);
            if (msg.names) player = msg.names;

            let defen = rule['配給原点'];

            paipu = {
                title:  'Mjai '+ new Date().toLocaleString(),
                player: player,
                qijia:  0,
                log:    [],
                defen:  [ defen, defen, defen, defen ],
                rank:   [],
                point:  []
            };
            let kaiju = {
                id:     id,
                rule:   rule,
                title:  paipu.title,
                player: paipu.player,
                qijia:  paipu.qijia
            };
            return { kaiju: kaiju };
        }
        else if (msg.type == 'start_kyoku') {

            if (msg.scores) paipu.defen = msg.scores;

            let qipai = {
                zhuangfeng: { E:0, S:1, W:2, N:3 }[msg.bakaze],
                jushu:      msg.kyoku - 1,
                changbang:  msg.honba,
                lizhibang:  msg.kyotaku,
                defen:      [],
                baopai:     pai(msg.dora_marker),
                shoupai:    ['', '','',''],
            };
            lunban = [];
            for (let id = 0; id < 4; id++) {
                lunban[id] = (4 - paipu.qijia + 4 - qipai.jushu + id) % 4;
                qipai.defen[lunban[id]] = paipu.defen[id];
                qipai.shoupai[lunban[id]]
                        = msg.tehais[id].map(p => pai(p)).join('');
            }
            lizhi = false;
            all_fulou = [[],[],[],[]];
            paipu.log.push([ { qipai: qipai } ]);
            return { qipai: qipai };
        }
        else if (msg.type == 'tsumo') {
            let zimo = { l: lunban[msg.actor], p: pai(msg.pai)};
            paipu.log[paipu.log.length - 1].push({ zimo: zimo });
            return { zimo: zimo };
        }
        else if (msg.type == 'dahai') {
            let dapai = { l: lunban[msg.actor],
                          p: pai(msg.pai) + (msg.tsumogiri ? '_' : '')
                                          + (lizhi         ? '*' : '')};
            paipu.log[paipu.log.length - 1].push({ dapai: dapai });
            return { dapai: dapai };
        }
        else if (msg.type == 'chi' || msg.type == 'pon' ||
                 msg.type ==  'daiminkan')
        {
            let fulou = { l: lunban[msg.actor],
                          m: mianzi(msg.actor, msg.target,
                                    ...msg.consumed, msg.pai) };
            paipu.log[paipu.log.length - 1].push({ fulou: fulou });
            all_fulou[fulou.l].push(fulou.m);
            return { fulou: fulou };
        }
        else if (msg.type == 'ankan') {
            let gang = { l: lunban[msg.actor],
                         m: mianzi(msg.actor, msg.actor, ...msg.consumed) };
            paipu.log[paipu.log.length - 1].push({ gang: gang });
            all_fulou[gang.l].push(gang.m);
            return { gang: gang };
        }
        else if (msg.type == 'kakan') {
            let i = all_fulou[lunban[msg.actor]]
                        .map(m => m.slice(0,2).replace(/0/,'5'))
                        .indexOf(pai(msg.pai).replace(/0/,'5'));
            let gang = { l: lunban[msg.actor],
                         m: all_fulou[lunban[msg.actor]][i] + pai(msg.pai)[1] };
            paipu.log[paipu.log.length - 1].push({ gang: gang });
            return { gang: gang };
        }
        else if (msg.type == 'dora') {
            let kaigang = { baopai: pai(msg.dora_marker) };
            paipu.log[paipu.log.length - 1].push({ kaigang: kaigang });
            return { kaigang: kaigang };
        }
        else if (msg.type == 'reach') {
            lizhi = true;
        }
        else if (msg.type == 'reach_accepted') {
            paipu.defen[msg.actor] -= 1000;
            lizhi = false;
        }
        else if (msg.type == 'hora') {

            if (! msg.yakus) {
                for (let id = 0; id < 4; id++) {
                    paipu.defen[id] += msg.deltas[id];
                }
                return;
            }

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
            if (all_fulou[hule.l].length) {
                hule.shoupai += ',' + all_fulou[hule.l].join(',');
            }
            paipu.log[paipu.log.length - 1].push({ hule: hule });
            paipu.defen = msg.scores.concat();
            return { hule: hule };
        }
        else if (msg.type == 'ryukyoku') {

            if (! msg.tehais) {
                for (let id = 0; id < 4; id++) {
                    paipu.defen[lunban[id]] += msg.deltas[id];
                }
                return;
            }

            let fenpei = [];
            for (let id = 0; id < 4; id++) {
                fenpei[lunban[id]] = msg.deltas[id];
            }
            let pingju = {
                name:    msg.reason,
                shoupai: ['','','',''],
                fenpei:  fenpei
            };
            for (let id = 0; id < 4; id++) {
                let l = lunban[id];
                pingju.shoupai[l] = msg.tehais[id].map(p => pai(p)).join('');
                if (! pingju.shoupai[l]) continue;
                if (all_fulou[l].length) {
                    pingju.shoupai[l] += ',' + all_fulou[l].join(',');
                }
            }
            paipu.log[paipu.log.length - 1].push({ pingju: pingju });
            paipu.defen = msg.scores.concat();
            return { pingju: pingju };
        }
        else if (msg.type == 'end_game') {

            if (msg.scores) paipu.defen = msg.scores.concat();

            paipu.rank  = make_rank(paipu);
            paipu.point = make_point(paipu, rule);
        }
    }
}
