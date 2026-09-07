# Verification

2026-09-07にローカルで確認した範囲:

- ローカル検証ログインから英語選択まで進める
- YouTube公式IFrame Playerでサンプル動画を表示する
- 字幕行タップで700msプリロール位置へシークして再生する
- 4択穴埋め問題を採点する
- 正答後に学習試行と教材完了をサーバー側へ保存する
- ページ再読み込み後もプロフィールと完了記録を復元する
- 同じ回答IDを2回送っても試行・完了を1件だけ保存する
- 学習日はIANAタイムゾーンを使い午前4時に切り替える
- `.data/learning-records.json` は0600で作成され、Git対象外
- `npm test`、`npm run lint`、`npm run build` 成功

未完了:

- Google・Apple OIDCの実アカウント検証
- PostgreSQL、Object Storage、ジョブキューへの接続
- 別端末間の実ネットワーク同期
- 公開権利を確認済みの字幕素材への差し替え
