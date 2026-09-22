/*
 *  convert
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

function hai(s, n) {
    return s == 'z'? ['','E','S','W','N','P','F','C'][+n]
                   : (+n||5) + s + (+n ? '' : 'r');
}

const HUPAI = {
    reach:              '立直',
    double_reach:       'ダブル立直',
    ippatsu:            '一発',
    haiteiraoyue:       '海底摸月',
    hoteiraoyui:        '河底撈魚',
    rinshankaiho:       '嶺上開花',
    chankan:            '槍槓',
    menzenchin_tsumoho: '門前清自摸和',
    bakaze:             '場風',
    jikaze:             '自風',
    sangenpai:          '翻牌',
    pinfu:              '平和',
    tanyaochu:          '断幺九',
    ipeko:              '一盃口',
    sanshokudojun:      '三色同順',
    ikkitsukan:         '一気通貫',
    honchantaiyao:      '混全帯幺九',
    chitoitsu:          '七対子',
    toitoiho:           '対々和',
    sananko:            '三暗刻',
    sankantsu:          '三槓子',
    sanshokudoko:       '三色同刻',
    honroto:            '混老頭',
    shosangen:          '小三元',
    honiso:             '混一色',
    junchantaiyao:      '純全帯幺九',
    ryanpeko:           '二盃口',
    chiniso:            '清一色',

    tenho:              '天和',
    chiho:              '地和',
    kokushimuso:        '国士無双',
    suanko:             '四暗刻',
    daisangen:          '大三元',
    shosushi:           '小四喜',
    daisushi:           '大四喜',
    tsuiso:             '字一色',
    ryuiso:             '緑一色',
    chinroto:           '清老頭',
    sukantsu:           '四槓子',
    churenpoton:        '九蓮宝燈',

    dora:               'ドラ',
    akadora:            '赤ドラ',
    uradora:            '裏ドラ'
};

const PINGJU = {
    fanpai:         '荒牌平局',
    nagashimangan:  '流し満貫',
    kyushukyuhai:   '九種九牌',
    sufonrenta:     '四風連打',
    suchareach:     '四家立直',
    sanchaho:       '三家和',
    sukaikan:       '四開槓'
};

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


function convreq(rule) {

    let id, paipu, lunban, lizhi, gangzimo, all_fulou;

    return function(req) {

        if (! req) return paipu;

        if (req.type == 'start_game') {

            id = req.id;

            let title = (req.names ? 'Mjaiサーバー' : 'RiichiLab')
                      + `\n${new Date().toLocaleString()}`;
            let player = ['私','下家','対面','上家'];
            player = player.splice((4 - id) % 4).concat(player);
            if (req.names) player = req.names;

            let defen = rule['配給原点'];

            paipu = {
                title:  title,
                player: player,
                qijia:  null,
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
        else if (req.type == 'start_kyoku') {

            if (paipu.qijia == null) paipu.qijia = req.oya;

            if (req.scores) paipu.defen = req.scores;

            let qipai = {
                zhuangfeng: { E:0, S:1, W:2, N:3 }[req.bakaze],
                jushu:      req.kyoku - 1,
                changbang:  req.honba,
                lizhibang:  req.kyotaku,
                defen:      [],
                baopai:     pai(req.dora_marker),
                shoupai:    ['', '','',''],
            };
            lunban = [];
            for (let id = 0; id < 4; id++) {
                lunban[id] = (4 - paipu.qijia + 4 - qipai.jushu + id) % 4;
                qipai.defen[lunban[id]] = paipu.defen[id];
                qipai.shoupai[lunban[id]]
                        = Majiang.Shoupai.fromString(
                                req.tehais[id].map(p => pai(p)).join('')
                            ).toString();
            }
            lizhi = null;
            gangzimo = null;
            all_fulou = [[],[],[],[]];
            paipu.log.push([ { qipai: qipai } ]);
            return { qipai: qipai };
        }
        else if (req.type == 'tsumo') {
            let zimo = { l: lunban[req.actor], p: pai(req.pai)};
            if (gangzimo == req.actor) {
                paipu.log[paipu.log.length - 1].push({ gangzimo: zimo });
                return { gangzimo: zimo };
            }
            else {
                paipu.log[paipu.log.length - 1].push({ zimo: zimo });
                return { zimo: zimo };
            }
        }
        else if (req.type == 'dahai') {
            let dapai = { l: lunban[req.actor],
                          p: pai(req.pai) + (req.tsumogiri      ? '_' : '')
                                          + (lizhi == req.actor ? '*' : '')};
            paipu.log[paipu.log.length - 1].push({ dapai: dapai });
            return { dapai: dapai };
        }
        else if (req.type == 'chi' || req.type == 'pon' ||
                 req.type ==  'daiminkan')
        {
            if (req.type ==  'daiminkan') gangzimo = req.actor;
            let fulou = { l: lunban[req.actor],
                          m: mianzi(req.actor, req.target,
                                    ...req.consumed, req.pai) };
            paipu.log[paipu.log.length - 1].push({ fulou: fulou });
            all_fulou[fulou.l].push(fulou.m);
            return { fulou: fulou };
        }
        else if (req.type == 'ankan') {
            gangzimo = req.actor;
            let gang = { l: lunban[req.actor],
                         m: mianzi(req.actor, req.actor, ...req.consumed) };
            paipu.log[paipu.log.length - 1].push({ gang: gang });
            all_fulou[gang.l].push(gang.m);
            return { gang: gang };
        }
        else if (req.type == 'kakan') {
            gangzimo = req.actor;
            let i = all_fulou[lunban[req.actor]]
                        .map(m => m.slice(0,2).replace(/0/,'5'))
                        .indexOf(pai(req.pai).replace(/0/,'5'));
            let gang = { l: lunban[req.actor],
                         m: all_fulou[lunban[req.actor]][i] + pai(req.pai)[1] };
            paipu.log[paipu.log.length - 1].push({ gang: gang });
            return { gang: gang };
        }
        else if (req.type == 'dora') {
            let kaigang = { baopai: pai(req.dora_marker) };
            paipu.log[paipu.log.length - 1].push({ kaigang: kaigang });
            return { kaigang: kaigang };
        }
        else if (req.type == 'reach') {
            lizhi = req.actor;
        }
        else if (req.type == 'reach_accepted') {
            paipu.defen[req.actor] -= 1000;
            lizhi = null;
        }
        else if (req.type == 'hora') {

            if (! req.yakus) {
                for (let id = 0; id < 4; id++) {
                    paipu.defen[id] += req.deltas[id];
                }
                return;
            }

            let fenpei = [];
            for (let id = 0; id < 4; id++) {
                fenpei[lunban[id]] = req.deltas[id];
            }
            let hule = {
                l:        lunban[req.actor],
                shoupai:  Majiang.Shoupai.fromString(
                                req.hora_tehais.map(p => pai(p)).join('')
                            ).toString(),
                baojia:   req.actor == req.target ? null : lunban[req.target],
                fubaopai: req.uradora_markers.length
                                ? req.uradora_markers.map(p => pai(p))
                                : null,
                fu:       req.fu,
                fanshu:   req.fan,
                defen:    req.hora_points,
                hupai:    req.yakus.map(h =>({ name: HUPAI[h[0]] ?? h[0],
                                               fanshu: h[1] })),
                fenpei:   fenpei
            };
            if (hule.baojia != null) hule.shoupai += pai(req.pai);
            if (all_fulou[hule.l].length) {
                hule.shoupai += ',' + all_fulou[hule.l].join(',');
            }
            paipu.log[paipu.log.length - 1].push({ hule: hule });
            paipu.defen = req.scores.concat();
            return { hule: hule };
        }
        else if (req.type == 'ryukyoku') {

            if (! req.tehais) {
                for (let id = 0; id < 4; id++) {
                    paipu.defen[id] += req.deltas[id];
                }
                return;
            }

            let fenpei = [];
            for (let id = 0; id < 4; id++) {
                fenpei[lunban[id]] = req.deltas[id];
            }
            let pingju = {
                name:    PINGJU[req.reason] ?? req.reason,
                shoupai: ['','','',''],
                fenpei:  fenpei
            };
            for (let id = 0; id < 4; id++) {
                let l = lunban[id];
                pingju.shoupai[l] = req.tehais[id].map(p => pai(p)).join('');
                if (! pingju.shoupai[l]) continue;
                if (all_fulou[l].length) {
                    pingju.shoupai[l] += ',' + all_fulou[l].join(',');
                }
                pingju.shoupai[l] = Majiang.Shoupai.fromString(
                                                pingju.shoupai[l]).toString();
            }
            paipu.log[paipu.log.length - 1].push({ pingju: pingju });
            paipu.defen = req.scores.concat();
            return { pingju: pingju };
        }
        else if (req.type == 'end_game') {

            if (req.scores) paipu.defen = req.scores.concat();

            paipu.rank  = make_rank(paipu);
            paipu.point = make_point(paipu, rule);
        }
    }
}

function convres() {

    let id, last;

    return function(req, rep) {

        if (req.type == 'start_game') id = req.id;

        let res = { type: 'none' };

        if (! rep && last) {
            res  = last;
            last = null;
        }
        else if (rep && rep.dapai) {
            let p = rep.dapai;
            res = { type: 'dahai', actor: id,
                    pai: hai(...p), tsumogiri: p[2] == '_' };
            if (p.slice(-1) == '*') {
                last = res;
                res  = { type: 'reach', actor: id };
            }
        }
        else if (rep && rep.fulou) {
            res = { type: '', actor: id, target: req.actor,
                    pai: req.pai, consumed: []};
            let m = rep.fulou;
            let s = m[0];
            res.type = m.match(/\d{4}/)                   ? 'daiminkan'
                     : m.replace(/0/,'5').match(/(\d)\1/) ? 'pon'
                     :                                      'chi';
            res.consumed
                    = m.match(/\d(?![\+\=\-])/g).map(n => hai(s, n));
        }
        else if (rep && rep.gang) {
            let m = rep.gang;
            let s = m[0];
            if (m.match(/\d{4}/)) {
                res = { type: 'ankan', actor: id, consumed: [] };
                res.consumed = m.match(/\d/g).map(n => hai(s, n));
            }
            else {
                res = { type: 'kakan', actor: id, pai: '', consumed: [] };
                res.pai = hai(s, m.slice(-1));
                res.consumed
                        = m.match(/(?<![\+\=\-])\d/g).map(n => hai(s, n));
            }
        }
        else if (rep && rep.hule) {
            res = { type: 'hora', actor: id,
                    target: req.actor, pai: req.pai };
        }
        else if (rep && rep.daopai) {
            if (req.type == 'tsumo') {
                res = { type: 'ryukyoku', actor: id, reason: 'kyushukyuhai' };
            }
        }

        return res;
    }
}

module.exports = {
    convreq: convreq,
    convres: convres,
};
