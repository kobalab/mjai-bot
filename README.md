# mjai-bot

[Mjaiプロトコル](https://gimite.net/pukiwiki/index.php?Mjai%20麻雀AI対戦サーバ) にしたがい対局する麻雀ボット

[@kobalab/majiang-ai](https://www.npmjs.com/package/@kobalab/majiang-ai) を組み込んだ麻雀ボットです。
**mjai-diannao** の接続先URL表記は Mjai の標準にしたがっていますので、Mjaiサーバーとともに起動するボットとして指定可能です。

## 使用方法

### mjai-diannao mjsonp://*host*:*port*/*room*

#### host
接続するMjaiサーバーのホスト名あるいはIPアドレスを指定します

#### port
接続するMjaiサーバーのポート番号を指定します

#### room
接続するMjaiサーバーのルーム名を指定します

#### --output, -o
指定されたファイルに [牌譜](https://github.com/kobalab/majiang-core/wiki/%E7%89%8C%E8%AD%9C) を出力します

#### --legacy, -l
対局者の [思考アルゴリズム](https://github.com/kobalab/majiang-ai/blob/master/legacy/README.md) を指定します

#### --verbose, -v
Mjaiプロトコルの通信を表示します

## ライセンス
[MIT](https://github.com/kobalab/mjai-bot/blob/master/LICENSE)

## 作者
[Satoshi Kobayashi](https://github.com/kobalab)
