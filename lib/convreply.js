/*
 *  convmsg
 */
"use strict";

const Majiang = require('@kobalab/majiang-core');

function pai(s, n) {
    return s == 'z'? ['','E','S','W','N','P','F','C'][+n]
                   : (+n||5) + s + (+n ? '' : 'r');
}

module.exports = function() {

    let last;

    return function(msg, id, rep) {

        let reply = { type: 'none' };

        if (! rep && last) {
            reply = last;
            last = null;
        }
        else if (rep && rep.dapai) {
            let p = rep.dapai;
            reply = { type: 'dahai', actor: id,
                      pai: '', tsumogiri: false };
            reply.pai = pai(p[0], p[1]);
            reply.tsumogiri = p[2] == '_';
            if (p.slice(-1) == '*') {
                last = reply;
                reply = { type: 'reach', actor: id };
            }
        }
        else if (rep && rep.fulou) {
            reply = { type: '', actor: id, target: msg.actor,
                      pai: msg.pai, consumed: []};
            let m = rep.fulou;
            let s = m[0];
            reply.type = m.match(/\d{4}/)                   ? 'daiminkan'
                       : m.replace(/0/,'5').match(/(\d)\1/) ? 'pon'
                       :                                      'chi';
            reply.consumed
                    = m.match(/\d(?![\+\=\-])/g).map(n => pai(s, n));
        }
        else if (rep && rep.hule) {
            reply = { type: 'hora', actor: id,
                      target: msg.actor, pai: msg.pai };
        }
        return reply;
    }
}
