# Lingoflow — YouTube再生・字幕同期スパイク

公式YouTube IFrame Playerを使う、Vite + TypeScriptの小さなWeb実装。APIキー、バックエンド、字幕取得サービスは不要です。

## 起動

Node.js 22.18以上（検証は26.3.0）とnpmを使用します。

```sh
cd spikes/youtube-caption-sync
npm ci
npm run dev
```

リポジトリ直下から上記を実行し、http://127.0.0.1:5180/ を開きます。YouTubeへのインターネット接続が必要です。既存試作とポートが重ならないよう5180を使用します。`file://` でHTMLを直接開かないでください。

```sh
npm test
npm run build
npm run preview
```

プレビューは http://127.0.0.1:4173/ 。開発・プレビューサーバーはループバックに限定しています。

## 試すこと

1. 公式プレイヤーを再生すると、動画下の字幕一覧が追従し、現在行がダークインディゴのカードとして強調されます。
2. 一時停止すると字幕と時刻が停止します。公式プレイヤー側での停止・シークにも追従します。
3. 字幕行または下部の前後フレーズボタンで、対象フレーズの `max(0, startMs - 700)` にシークして再生します。プリロール中も移動先の字幕を表示します。
4. 「集中表示」と「字幕リスト」を切り替えられます。重要単語のコーラル表示をタップすると解説シートが開きます。
5. ヘッダーの「JA / EN」で日本語訳を表示・非表示にできます。
6. 下部デッキで前後フレーズ、1文リピート、再生・停止、速度変更、発話練習への切り替えを試せます。
7. 「Practice Speaking」を押すと動画が停止し、表示中の字幕を使った発話練習シートが開きます。1.0x／0.8xのお手本、マイク認識、即時採点、自分の録音再生、再挑戦を確認できます。
8. ヘッダーの「Quiz」を押すと、動画内の3表現を使った4択穴埋めクイズが開きます。フレーズ音声、正誤バナー、結果、再挑戦を確認できます。
9. 「開発・表示設定」を開くとプレイヤーの時刻・状態・字幕ID・シーク要求と着地を確認できます。

## 発話練習（Technical Spike 2）

- `SpeechSynthesisUtterance` の `en-US` 音声を1.0x／0.8xで再生します。
- `SpeechRecognition` または `webkitSpeechRecognition` と `MediaRecorder` を同時に開始し、発話終了時に即時採点します。外部APIキーは使いません。
- 大文字小文字、アポストロフィ、記号を除いて単語列を整列比較します。目標単語に対する一致率が85%以上なら「伝わる！」、60〜84%なら「もう一度！」、60%未満なら「要練習」です。
- 録音BlobとObject URLはメモリだけに保持します。閉じる、ページ離脱、再挑戦時に録音停止、MediaStreamトラック停止、Object URL破棄を行います。録音や認識結果をストレージへ保存しません。
- マイク権限拒否、音声認識・録音API非対応、無音、音声認識エラーを日本語で案内します。

## 段階式穴埋め（Technical Spike 3）

- `elephants`、`long trunks`、`pretty much` の3問を、動画の字幕・日本語訳・再生区間と対応させています。
- 各問は正解1つとdistractor 3つを持ち、選択後にだけ回答できます。回答確定後は選択をロックします。
- 正解時はEmerald、不正解時はCoral Orangeの判定バナーを表示します。色に加えてSVG、文言、正解表現、短い解説でも結果を伝えます。
- 効果音はWeb Audio APIのOscillatorとGainで都度合成し、外部音声ファイルを使いません。
- 完了時に正答数と1問5 XPを表示し、動画ID、完了日時、午前4時区切りの学習日、正答数、XPを `localStorage` へ保存します。

## 同期の方式と精度

- `getCurrentTime() * 1000` を約50ms間隔で取得し、`startMs <= timeMs < endMs` で字幕を選択。別時計で再生時間を進めません。
- `requestAnimationFrame` は表示中の更新に使用。非表示タブではブラウザに間引かれます。復帰時は実プレイヤー時刻を再取得します。
- シーク直後は古い取得値による逆戻りを抑制。最新要求から400ms以内に着地するか2秒経過したら実時刻に戻します。連続タップでは最新要求を優先します。
- スクラブ・シーク直後の数値は移動先のプレビューです。`seek settled` はその後APIから読んだ時刻です。要求と一致しても、映像・音声が物理的に1ms精度で着地した証明ではありません。
- ミリ秒単位のデータと比較を使いますが、YouTubeの非同期更新、キーフレーム、負荷、手動字幕時刻による誤差があります。サンプル単位・1ms単位の精度は保証しません。

## サンプル字幕

[jawed「Me at the zoo」](https://www.youtube.com/watch?v=jNQXAC9IVRw) の短い抜粋5区間を手動で記述した検証fixtureです。動画・音声をダウンロードせず、字幕APIやスクレイピングも使用していません。字幕未収録の区間は意図的に空表示としています。時刻は概算で、正式教材として校正・利用条件を確認したデータではありません。

`src/captions.ts` の動画IDと字幕配列を対にして差し替えられます。任意動画の字幕自動生成、実AIへの接続、サーバー側の高度な発音評価、アカウント・学習記録はこのスパイクには含めていません。AI解説欄は操作確認用の固定サンプルです。

## ファイル

- `src/main.ts`: 画面、公式プレイヤー連携、状態、50ms取得、操作
- `src/learning-ui.ts`: 解説シート、単語・フレーズ保存、発音読み上げ
- `src/speaking-practice.ts`: 発話練習、ブラウザ音声API、単語照合、3段階採点、録音破棄
- `src/cloze-quiz.ts`: 4択問題、セッション状態、動画区間再生、正誤音、完了記録
- `src/youtube.ts`: APIローダーと最小型定義
- `src/sync.ts`: 時刻判定とシーク保護（単体テスト対象）
- `src/captions.ts`: 固定の抜粋字幕
- `src/style.css`: レスポンシブ、ライト・ダーク、色トークン
- `tests/sync.test.ts`: 境界、preroll、古い値、連続シーク、タイムアウト
- `tests/speaking-practice.test.ts`: 正規化、語の抜けを含む整列、採点境界
- `tests/cloze-quiz.test.ts`: 4択データ、厳密採点、状態遷移、午前4時境界
- `VERIFICATION.md`: 実ブラウザでの観測と限界

`lingoflow_advanced_player_concept_2026-09-06.jpg` と `lingoflow_transcript_view_concept_2026-09-06.jpg` を基準に、Deep Night Slateの画面、字幕一覧、インディゴの現在行、統一色の操作デッキを採用しています。操作アイコンはすべてインラインSVGで、動画上には独自操作を重ねていません。PCでは最大430pxのアプリ枠を中央表示し、スマホでは画面幅に広がります。設計書自体は変更していません。

## 参照

プレイヤー実装では36 v1.1、26 v0.2、18 v0.5、37 v0.1を参照し、Technical Spike 2では26 v0.4第9章、Technical Spike 3では30 v0.7を追加参照しました。

- [YouTube公式 IFrame API](https://developers.google.com/youtube/iframe_api_reference)：公式制御、時刻取得、シーク、イベント、最小サイズ
- [YouTube公式 Player parameters](https://developers.google.com/youtube/player_parameters)：埋め込み設定
