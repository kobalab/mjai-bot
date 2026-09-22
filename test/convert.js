const assert = require('assert');

const convert = require('../lib/convert');
const Majiang = require('@kobalab/majiang-core');

const rule = Majiang.rule();

suite('convert', ()=>{

    suite('convreq()', ()=>{

        function init(rule) {
            const convreq = convert.convreq(rule);
            convreq({ type:'hello', protocol:'mjsonp', protocol_version:1 });
            convreq({ type:'start_game', id:1 });
            convreq({ type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                    ] });
            return convreq;
        }

        test('type: "hello"', ()=>{
            const convreq = convert.convreq(rule);
            assert.equal(convreq({ type:'hello' }), null);
        });

        test('type: "start_game" (names: あり)', ()=>{
            const convreq = convert.convreq(rule);
            let msg = convreq(
                        { type:'start_game', id:1, names:['A','B','C','D']});
            assert.ok(msg.kaiju);
            assert.equal(msg.kaiju.id, 1);
            assert.deepEqual(msg.kaiju.rule, rule);
            assert.ok(msg.kaiju.title);
            assert.deepEqual(msg.kaiju.player, ['A','B','C','D']);
        });
        test('type: "start_game" (names: なし)', ()=>{
            const convreq = convert.convreq(rule);
            let msg = convreq({ type:'start_game', id:1 });
            assert.deepEqual(msg.kaiju.player, ['上家','私','下家','対面']);
        });

        test('type: "start_kyoku" (東一局)', ()=>{
            const convreq = convert.convreq(rule);
            convreq({ type:'start_game', id:1 });
            let msg = convreq(
                    { type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                      ] });
            assert.deepEqual(msg, { qipai: {
                        zhuangfeng: 0, jushu: 0, changbang: 1, lizhibang: 2,
                        defen:[ 25000, 25000, 25000, 25000 ], baopai:'z1',
                        shoupai:['','','','m10p40s09z1234567'] } });
        });
        test('type: "start_kyoku" (南二局)', ()=>{
            const convreq = convert.convreq(rule);
            convreq({ type:'start_game', id:1 });
            convreq({ type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[[],[],[],[]] })
            let msg = convreq(
                    { type:'start_kyoku', bakaze:'S', kyoku:2, honba: 1,
                      kyotaku: 2, oya: 3, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                      ] });
            assert.deepEqual(msg, { qipai: {
                        zhuangfeng: 1, jushu: 1, changbang: 1, lizhibang: 2,
                        defen:[ 25000, 25000, 25000, 25000 ], baopai:'z1',
                        shoupai:['','','m10p40s09z1234567',''] } });
        });
        test('type: "start_kyoku" (西三局)', ()=>{
            const convreq = convert.convreq(rule);
            convreq({ type:'start_game', id:1 });
            convreq({ type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[[],[],[],[]] })
            let msg = convreq(
                    { type:'start_kyoku', bakaze:'W', kyoku:3, honba: 1,
                      kyotaku: 2, oya: 0, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                      ] });
            assert.deepEqual(msg, { qipai: {
                        zhuangfeng: 2, jushu: 2, changbang: 1, lizhibang: 2,
                        defen:[ 25000, 25000, 25000, 25000 ], baopai:'z1',
                        shoupai:['','m10p40s09z1234567','',''] } });
        });
        test('type: "start_kyoku" (北四局)', ()=>{
            const convreq = convert.convreq(rule);
            convreq({ type:'start_game', id:1 });
            convreq({ type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[[],[],[],[]] })
            let msg = convreq(
                    { type:'start_kyoku', bakaze:'N', kyoku:4, honba: 1,
                      kyotaku: 2, oya: 1, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                      ] });
            assert.deepEqual(msg, { qipai: {
                        zhuangfeng: 3, jushu: 3, changbang: 1, lizhibang: 2,
                        defen:[ 25000, 25000, 25000, 25000 ], baopai:'z1',
                        shoupai:['m10p40s09z1234567','','',''] } });
        });
        test('type: "start_kyoku" (scores: あり)', ()=>{
            const convreq = convert.convreq(rule);
            convreq({ type:'start_game', id:1 });
            let msg = convreq(
                    { type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?']],
                      scores:[ 20000, 24000, 26000, 30000 ] });
            assert.deepEqual(msg, { qipai: {
                        zhuangfeng: 0, jushu: 0, changbang: 1, lizhibang: 2,
                        defen:[ 26000, 30000, 20000, 24000 ], baopai:'z1',
                        shoupai:['','','','m10p40s09z1234567'] } });
        });
        test('type: "start_kyoku" (配給原点を 27,000 に指定)', ()=>{
            const convreq = convert.convreq(
                                    Majiang.rule({'配給原点':27000}));
            convreq({ type:'start_game', id:1 });
            let msg = convreq(
                    { type:'start_kyoku', bakaze:'E', kyoku:1, honba: 1,
                      kyotaku: 2, oya: 2, dora_marker:'E',
                      tehais:[
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['1m','5mr','4p','5pr','5sr','9s',
                                                 'E','S','W','N','P','F','C'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                        ['?','?','?','?','?','?','?','?','?','?','?','?','?'],
                      ] });
            assert.deepEqual(msg, { qipai: {
                        zhuangfeng: 0, jushu: 0, changbang: 1, lizhibang: 2,
                        defen:[ 27000, 27000, 27000, 27000 ], baopai:'z1',
                        shoupai:['','','','m10p40s09z1234567'] } });
        });

        test('type: "tsumo" (マスクあり)', ()=>{
            const convreq = init(rule);
            assert.deepEqual(convreq({ type:'tsumo', actor: 0, pai:'?' }),
                                     { zimo: { l: 2, p:'' } });
        });
        test('type: "tsumo" (マスクなし)', ()=>{
            const convreq = init(rule);
            assert.deepEqual(convreq({ type:'tsumo', actor: 1, pai:'1m' }),
                                     { zimo: { l: 3, p:'m1' } });
        });

        test('type: "dahai" (手出し)', ()=>{
            const convreq = init(rule);
            assert.deepEqual(
                convreq({ type:'dahai', actor: 0, pai:'1p', tsumogiri: false }),
                        { dapai: { l: 2, p:'p1' } });
        });
        test('type: "dahai" (ツモ切り)', ()=>{
            const convreq = init(rule);
            assert.deepEqual(
                convreq({ type:'dahai', actor: 1, pai:'1s', tsumogiri: true }),
                        { dapai: { l: 3, p:'s1_' } });
        });

        test('type: "chi"', ()=>{
            const convreq = init(rule);
            convreq({ type:'dahai', actor: 3, pai:'5sr', tsumogiri: false });
            assert.deepEqual(
                convreq({ type:'chi', actor: 0, target: 3, pai:'5sr',
                          consumed:['6s','7s'] }),
                        { fulou: { l: 2, m:'s0-67' } });
        });
        test('type: "pon"', ()=>{
            const convreq = init(rule);
            convreq({ type:'dahai', actor: 3, pai:'5s', tsumogiri: false });
            assert.deepEqual(
                convreq({ type:'pon', actor: 1, target: 3, pai:'5s',
                          consumed:['5s','5sr'] }),
                        { fulou: { l: 3, m:'s505=' } });
        });
        test('type: "daiminkan"', ()=>{
            const convreq = init(rule);
            convreq({ type:'dahai', actor: 3, pai:'5s', tsumogiri: false });
            assert.deepEqual(
                convreq({ type:'daiminkan', actor: 2, target: 3, pai:'5s',
                          consumed:['5s','5s','5sr'] }),
                        { fulou: { l: 0, m:'s5505+' } });
        });

        test('type: "ankan"', ()=>{
            const convreq = init(rule);
            convreq({ type:'tsumo', actor: 0, pai:'?' });
            assert.deepEqual(
                convreq({ type:'ankan', actor: 0, consumed:['N','N','N','N'] }),
                        { gang: { l: 2, m:'z4444' } });
        });
        test('type: "kakan"', ()=>{
            const convreq = init(rule);
            convreq({ type:'pon', actor: 0, target: 3, pai:'5m',
                      consumed:['5m','5mr'] });
            convreq({ type:'tsumo', actor: 0, pai:'?' });
            assert.deepEqual(
                convreq({ type:'kakan', actor: 0, pai:'5m',
                          consumed:['5m','5m','5mr']}),
                        { gang: { l: 2, m:'m505-5' } });
        });

        test('type: "tsumo" (大明槓のカンヅモ)', ()=>{
            const convreq = init(rule);
            convreq({ type:'daiminkan', actor: 2, target: 3, pai:'5s',
                      consumed:['5s','5s','5sr'] });
            assert.deepEqual(convreq({ type:'tsumo', actor: 2, pai:'?' }),
                            { gangzimo: { l: 0, p:'' } });
        });
        test('type: "tsumo" (暗槓のカンヅモ)', ()=>{
            const convreq = init(rule);
            convreq({ type:'ankan', actor: 0, consumed:['N','N','N','N'] });
            assert.deepEqual(convreq({ type:'tsumo', actor: 0, pai:'7m' }),
                            { gangzimo: { l: 2, p:'m7' } });
        });
        test('type: "tsumo" (加槓のカンヅモ)', ()=>{
            const convreq = init(rule);
            convreq({ type:'kakan', actor: 0, pai:'5m',
                      consumed:['5m','5m','5mr']});
            assert.deepEqual(convreq({ type:'tsumo', actor: 0, pai:'8m' }),
                            { gangzimo: { l: 2, p:'m8' } });
        });

        test('type: "dora"', ()=>{
            const convreq = init(rule);
            convreq({ type:'ankan', actor: 0, consumed:['N','N','N','N'] });
            assert.deepEqual(convreq({ type:'dora', dora_marker:'C' }),
                            { kaigang: { baopai: 'z7' } });
        });

        test('type: "reach" → "reach_accepted"', ()=>{
            const convreq = init(rule);
            assert.equal(convreq({ type:'reach', actor: 1 }), null);
            assert.deepEqual(convreq({ type:'dahai', actor: 1, pai: 'W',
                                       tsumogiri: true }),
                            { dapai: { l: 3, p:'z3_*' } });
            assert.equal(convreq({ type:'reach_accepted', actor: 1,
                                   deltas:[ 0, -1000, 0, 0 ],
                                   scores:[ 25000, 24000, 25000, 25000 ] }),
                         null);
        });

        test('type: "hora" (ツモ和了)', ()=>{
            const convreq = init(rule);
            convreq({ type:'tsumo', actor: 1, pai:'2m'});
            assert.deepEqual(
                convreq({ type:'hora', actor: 1, target: 1, pai:'2m',
                          uradora_markers:['8p'],
                          hora_tehais:['1m','3m','5m','6m','7m','1p','2p','3p',
                                       '4p','5pr','6p','W','W','2m'],
                          yakus:[ ['reach', 1],
                                  ['menzenchin_tsumoho', 1],
                                  ['akadora', 1] ],
                          fu: 30, fan: 3, hora_points: 4000,
                          deltas:[ -1100, 6300, -1100, -2100 ],
                          scores:[ 21900, 29300, 22900, 25900 ] }),
                { hule: { l: 3, shoupai:'m13567p123406z33m2', baojia: null,
                          fubaopai:['p8'], fu: 30, fanshu: 3, defen: 4000,
                          hupai: [ { name:'立直', fanshu: 1 },
                                   { name:'門前清自摸和', fanshu: 1 },
                                   { name: '赤ドラ', fanshu: 1 } ],
                          fenpei:[ -1100, -2100, -1100, 6300 ] } });
        });
        test('type: "hora" (ロン和了、裏ドラなし)', ()=>{
            const convreq = init(rule);
            convreq({ type:'pon', actor: 1, target: 2,
                      pai:'C', consumed:['C','C']});
            convreq({ type:'dahai', actor: 2, pai:'2m'});
            assert.deepEqual(
                convreq({ type:'hora', actor: 1, target: 2, pai:'2m',
                          uradora_markers:[],
                          hora_tehais:['1m','3m','5m','6m','7m','1p','2p','3p',
                                       'W','W'],
                          yakus:[ ['sangenpai', 1] ],
                          fu: 30, fan: 1, hora_points: 1000,
                          deltas:[ 0, 1300, -1300, 0 ],
                          scores:[ 25000, 26300, 23700, 25000 ] }),
                { hule: { l: 3, shoupai:'m13567p123z33m2,z777+', baojia: 0,
                          fubaopai: null, fu: 30, fanshu: 1, defen: 1000,
                          hupai: [ { name:'翻牌', fanshu: 1 } ],
                          fenpei:[ -1300, 0, 0, 1300 ] } });
        });
        test('type: "hora" (不明な和了役名)', ()=>{
            const convreq = init(rule);
            assert.deepEqual(
                convreq({ type:'hora', actor: 1, target: 2, pai:'2p',
                          uradora_markers:[],
                          hora_tehais:['2p','3p','3p','4p','4p','5p','5p','6p',
                                       '6p','7p','7p','8p','8p'],
                          yakus:[ ['daisharin', 13] ],
                          fu: 20, fan: 13, hora_points: 32000,
                          deltas:[ 0, 32000, -32000, 0 ],
                          scores:[ 25000, 57000, -7000, 25000 ] }),
                { hule: { l: 3, shoupai:'p2334455667788p2', baojia: 0,
                          fubaopai: null, fu: 20, fanshu: 13, defen: 32000,
                          hupai: [ { name:'daisharin', fanshu: 13 } ],
                          fenpei:[ -32000, 0, 0, 32000 ] } });
        });
        test('type: "hora" (詳細情報なし)', ()=>{
            const convreq = init(rule);
            assert.equal(convreq({ type:'hora', actor: 1,
                                   deltas:[ 0, 3900, -3900, 0 ] }),
                         null);
            assert.deepEqual(convreq().defen, [ 25000, 28900, 21100, 25000 ]);
        });

        test('type: "ryukyoku"', ()=>{
            const convreq = init(rule);
            convreq({ type:'pon', actor: 0, target: 2,
                      pai:'C', consumed:['C','C']});
            assert.deepEqual(
                convreq({ type:'ryukyoku', reason:'fanpai',
                          tehais:[ ['1m','3m','5m','6m','7m','1p','2p','3p',
                                    'W','W'],
                                   ['1m','3m','5m','6m','7m','1p','2p','3p',
                                    '4p','5pr','6p','W','W'],
                                   ['?','?','?','?','?','?','?','?','?','?'],
                                   ['?','?','?','?','?','?','?','?','?','?'] ],
                          tenpais:[ true, false, false, false ],
                          deltas:[ 3000, -1000, -1000, -1000 ],
                          scores:[ 28000, 24000, 24000, 24000 ] }),
                { pingju: { name: '荒牌平局',
                            shoupai:['','',
                                     'm13567p123z33,z777=','m13567p123406z33'],
                            fenpei:[ -1000, -1000, 3000, -1000 ] } });
        });
        test('type: "ryukyoku" (不明な流局理由)', ()=>{
            const convreq = init(rule);
            assert.deepEqual(
                convreq({ type:'ryukyoku', reason:'ryukyoku',
                          tehais:[ ['?','?','?','?','?','?','?','?','?','?'],
                                   ['?','?','?','?','?','?','?','?','?','?'],
                                   ['?','?','?','?','?','?','?','?','?','?'],
                                   ['?','?','?','?','?','?','?','?','?','?'] ],
                          tenpais:[ false, false, false, false ],
                          deltas:[ 0, 0, 0, 0 ],
                          scores:[ 25000, 25000, 25000, 25000 ] }),
                { pingju: { name: 'ryukyoku',
                            shoupai:['','','',''],
                            fenpei:[ 0, 0, 0, 0 ] } });
        });
        test('type: "ryukyoku" (詳細情報なし)', ()=>{
            const convreq = init(rule);
            assert.equal(convreq({ type:'ryukyoku', reason:'fanpai',
                                   deltas:[ 3000, -1000, -1000, -1000 ] }),
                         null);
            assert.deepEqual(convreq().defen, [ 28000, 24000, 24000, 24000 ]);
        });

        test('type: "end_kyoku"', ()=>{
            const convreq = init(rule);
            assert.equal(convreq({ type:'end_kyoku' }), null);
        });

        test('type: "end_game" (scores: あり)', ()=>{
            const convreq = init(rule);
            assert.equal(convreq({ type:'end_game',
                                   scores:[ 20000, 25000, 25000, 30000 ] }),
                         null);
            assert.deepEqual(convreq().defen, [20000, 25000, 25000, 30000 ]);
            assert.deepEqual(convreq().rank, [ 4, 3, 2, 1 ]);
            assert.deepEqual(convreq().point, ['-30.0','-15.0','5.0','40.0']);
        });
        test('type: "end_game" (scores: なし、順位点四捨五入)', ()=>{
            const convreq = init(Majiang.rule(
                                    {'順位点':['30','15','-15','-30']}));
            assert.equal(convreq({ type:'end_game' }), null);
            assert.deepEqual(convreq().defen, [25000, 25000, 25000, 25000 ]);
            assert.deepEqual(convreq().rank, [ 3, 4, 1, 2 ]);
            assert.deepEqual(convreq().point, ['-20','-35','45','10']);
        });
    });

    suite('convres()', ()=>{

        function init() {
            const convres = convert.convres();
            convres({ type: 'start_game', id: 1 }, {});
            return convres;
        }

        test('dapai (手出し)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: 'E'},
                                     { dapai: 'm1' }),
                             { type:'dahai', actor: 1, pai: '1m',
                               tsumogiri: false });
        });
        test('dapai (ツモ切り)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: 'C'},
                                     { dapai: 'z7_' }),
                             { type:'dahai', actor: 1, pai: 'C',
                               tsumogiri: true });
        });
        test('dapai (リーチ)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: 'E'},
                                     { dapai: 'z1_*' }),
                             { type:'reach', actor: 1 });
            assert.deepEqual(convres({ type:'reach', actor: 1 }, null),
                             { type:'dahai', actor: 1, pai: 'E',
                               tsumogiri: true });
        });

        test('fulou (チー)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'dahai', actor: 0, pai: '3s'},
                                     { fulou: 's3-40' }),
                             { type:'chi', actor: 1, target: 0,
                               pai: '3s', consumed:['4s','5sr'] });
        });
        test('fulou (ポン)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'dahai', actor: 2, pai: '5pr'},
                                     { fulou: 'p550+' }),
                             { type:'pon', actor: 1, target: 2,
                               pai: '5pr', consumed:['5p','5p'] });
        });
        test('fulou (大明槓)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'dahai', actor: 3, pai: '5m'},
                                     { fulou: 'm5505=' }),
                             { type:'daiminkan', actor: 1, target: 3,
                               pai: '5m', consumed:['5m','5m','5mr'] });
        });

        test('gang (暗槓)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: '9s'},
                                     { gang: 's9999' }),
                             { type:'ankan', actor: 1,
                               consumed:['9s','9s','9s','9s'] });
        });
        test('gang (加槓)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: 'F'},
                                     { gang: 'z666=6' }),
                             { type:'kakan', actor: 1, pai: 'F',
                               consumed:['F','F','F'] });
        });

        test('hule (ツモ和了)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: 'E'},
                                     { hule: '-' }),
                             { type:'hora', actor: 1, target: 1, pai: 'E' });
        });
        test('hule (ロン和了)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'dahai', actor: 0, pai: '5pr'},
                                     { hule: '-' }),
                             { type:'hora', actor: 1, target: 0, pai: '5pr' });
        });
        test('hule (槍槓)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'kakan', actor: 2, pai: '2p',
                                       consumed:['2p','2p','2p'] },
                                     { hule: '-' }),
                             { type:'hora', actor: 1, target: 2, pai: '2p' });
        });

        test('daopai (九種九牌)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'tsumo', actor: 1, pai: '9p' },
                                     { daopai: '-' }),
                             { type:'ryukyoku', actor: 1,
                               reason: 'kyushukyuhai' });
        });
        test('daopai (テンパイ宣言)', ()=>{
            const convres = init();
            assert.deepEqual(convres({ type:'dahai', actor: 0, pai: '9p',
                                       tsumogiri: false },
                                     { daopai: '-' }),
                             { type:'none' });
        });
    });
});
