# Content Access Gate spike

YouTubeの再生可否と、字幕の表示・加工・保存権限を別々に判定する技術スパイクです。公式IFrame Playerで実際の動画IDを確認し、利用権限を確認したWebVTTだけを教材化可能にします。ASRは明示的な音声処理許諾の設計が確定するまで無効です。

```bash
npm install
npm test
npm run build
npm run dev
```

`http://127.0.0.1:5181/` を開き、動画を再生確認します。字幕経路の検証には `fixtures/authorized-sample.en.vtt` を選び、実際に権限を確認できる場合だけ確認欄を選択します。このファイルは内部技術検証用の手動抜粋であり、公開配信の権利確認済み素材を意味しません。

## 判定原則

- IFrameの再生成功だけでは字幕利用可能と判定しません。
- 字幕権限がなければ視聴のみです。
- 表示限定字幕から表現抽出・教材保存は行いません。
- 動画ファイルとYouTube音声は保存しません。
- 公開実装ではYouTube Data APIの `status.embeddable` を事前判定に使い、IFrameのエラー100/101/150を最終状態へ反映します。
