# Analysis job pipeline spike

30分以内の動画区間を、動画確認、字幕準備、表現抽出、問題作成、完了の順で処理する非同期ジョブの中核です。キャッシュ、冪等キー、利用枠台帳、失敗・3分超過キャンセル時の返還を外部サービスなしで検証します。

```bash
npm install
npm test
npm run build
npm run benchmark
```

このスパイクのベンチマークはローカルの制御処理だけを測ります。ASR、翻訳、LLM、TTSの実時間・料金・品質は、権利確認済み素材と各事業者のテスト資格情報が揃った後に同じ `PipelineAdapters` を使って測定します。ローカル結果を「3分以内の実AI解析達成」とは扱いません。
