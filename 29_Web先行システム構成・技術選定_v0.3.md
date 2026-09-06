---
document: web-first-system-architecture
version: 0.3
status: draft-for-engineering-review
created: 2026-09-06
updated: 2026-09-06
owner: LilQ
related:
  - 17_パイロットMVP要件定義_v0.2.md
  - 20_YouTube動的追加・字幕処理設計_v0.2.md
  - 24_プロダクト決定事項_v1.3.md
---

# Lingoflow Web先行システム構成・技術選定 v0.3

## 1. 方針

スマートフォン対応Webアプリで中核体験を完成させ、検証後にiPhone・Androidアプリへ展開する。Web固有の実装へ学習ロジックを閉じ込めず、API、データ、解析ジョブを共通基盤にする。

## 2. 推奨構成

```text
Responsive Web App / PWA
  ├─ Google・Appleログイン
  ├─ YouTube IFrame Player
  ├─ 字幕・AI解説・ロードマップUI
  ├─ Web Push
  └─ IndexedDBオフライン教材
          ↓ HTTPS
Application API
  ├─ User / Language Profile
  ├─ Roadmap / Daily Plan
  ├─ Learning Progress / Review
  ├─ Search / Followed Channels
  └─ Content Access Gate
          ↓
Job Queue / Workers
  ├─ YouTube metadata check
  ├─ Caption ingestion / ASR
  ├─ Translation
  ├─ Phrase extraction / timing
  ├─ AI explanation / exercises
  └─ Safety / quality checks
          ↓
PostgreSQL + Object Storage + Cache
```

## 3. フロントエンド候補

第一候補はTypeScriptベースのReact／Next.js。理由は、レスポンシブWeb、PWA、OAuth、YouTube IFrame、国際化、サーバーAPIとの統合を一つのリポジトリで扱いやすいため。

Flutter Webを最初に選ぶ場合は、テキスト中心画面、Webアクセシビリティ、YouTube埋め込み、OAuth、PWA更新、SEO不要画面の実機比較を先に行う。MiraaがFlutterを使っている可能性は、LingoflowのWeb選定理由にはしない。

## 4. モバイル展開

候補は次の2案。

### A. WebをPWAとして検証後、React Nativeへ展開

- TypeScriptの型・APIクライアント・学習ロジックを共有しやすい
- UIはモバイル向けに再実装が必要
- ネイティブ通知、音声、オフラインを自然に扱える

### B. Web検証後、FlutterでiOS・Androidを構築

- モバイル2OSのUIを共有しやすい
- Web UIコードの直接再利用は限定的
- 動画、音声、バックグラウンド、課金を改めて検証する

Web検証前に最終決定せず、音声、字幕同期、オフライン、iPadレイアウトの技術試作結果で選ぶ。

## 5. 認証

- OIDC/OAuth対応の認証基盤
- GoogleとApple
- Webと将来のモバイルで同じユーザーIDを使う
- YouTube追加権限は通常ログインと別スコープ・別同意
- セッション失効、端末一覧、ログアウト、アカウント削除を設計する

## 6. データストア

- PostgreSQL：ユーザー、教材メタデータ、ロードマップ、進捗、復習、権利状態
- Object Storage：許可された字幕、AI教材、合成お手本音声
- Redis等：短時間キャッシュ、ジョブ制御、重複処理防止
- IndexedDB：Webのオフライン教材と未同期回答

動画本体と練習録音を永続保存しない。

## 7. 動画処理

- 検索・メタデータ：公式YouTube APIを基本とする
- 再生：YouTube IFrame Player
- 字幕：許可された供給経路を優先
- 字幕なし：処理条件を満たす場合にASRジョブ
- 最大30分
- 同一動画・字幕版・言語の生成物を共通キャッシュ
- ユーザー別の翻訳言語、レベル調整、理解度を分離
- 公開状態・字幕版は全件巡回せず、動画オープン時とプレイヤーエラー時にオンデマンド確認
- 再確認結果を動画ID単位で短時間キャッシュし、同時アクセス時の外部API呼び出しをまとめる

## 8. AI処理

```text
共通処理：字幕整形、言語判定、表現候補、時刻、基本解説
言語ペア処理：翻訳、サポート言語での説明
ユーザー処理：理解度、今日の表現、ロードマップ適合、追加質問
```

すべての生成物へ入力版、モデル、プロンプト、生成時刻を記録する。ジョブは再試行可能・冪等にする。

解析枠は `reserved`、`consumed`、`released` の台帳状態で管理する。教材生成成功時だけ `consumed` にし、素材品質不足、システム障害、初期値3分を超えたキャンセルでは冪等に `released` へ移す。ジョブ状態と請求状態を同一トランザクションまたは再実行可能な補償処理で整合させる。

## 9. 音声

- 初回設定の音声入力
- AI質問の読み上げ
- 発話認識
- お手本音声
- シャドーイング録音

ブラウザ差を吸収する抽象層を設ける。録音は一時領域に置き、練習終了時に削除する。聞くだけモードではマイク権限を要求しない。

## 10. 国際化

- locale文字列をコードから分離
- ICU MessageFormat等で複数形、日付、数値、右から左の表示を扱う
- العربيةではRTLレイアウトを検証する
- 学習言語と表示言語の方向が異なる字幕UIを検証する
- 翻訳欠落時のフォールバック順を定義する

## 11. オフライン

- PWA Service Workerでアプリ骨格をキャッシュ
- ユーザー指定教材をIndexedDBへ保存
- YouTube動画本体は対象外
- 未同期回答は一意ID付きキューで再送
- 教材更新時は新旧版を区別し、学習中に突然差し替えない
- オフライン教材の初期上限は端末ごとに500MB
- Wi-Fi時に更新を確認し、アクティブな学習セッションがない時だけ最新版へ切り替える
- 保存前に動画本体を含まないことを明示する

回答イベントはクライアント生成の一意IDで冪等に受け付ける。設定競合は更新時刻で解決し、習得・進級履歴はイベントから再計算して失わない。

## 11.1 通知ジョブ

通常リマインドとストリーク切れ警告を別ジョブ種別にする。ストリーク警告は学習日境界の午前4時を参照し、送信直前に当日の達成状態を再確認する。達成済みなら送信しない。ユーザーのタイムゾーン変更時は予約を再計算する。

## 12. 安全性

- 13歳以上の年齢ゲート
- 検索結果・サムネイル・字幕の安全分類
- ブロックリスト、報告、運営停止
- 自由入力とAI回答の安全処理
- 秘密情報をログへ残さない
- 権限の最小化

## 13. 観測性

- APIエラー率
- YouTube APIクォータ
- オンデマンド動画確認のキャッシュ命中率
- 解析ジョブ時間・失敗率
- 解析枠の予約・消費・返還件数と不整合件数
- 動画1本当たりAI費用
- 字幕同期ずれ
- キャッシュ再利用率
- 通知到達率
- オフライン同期失敗

## 14. 技術スパイク

実装決定前に次を小さく検証する。

1. モバイルSafari・ChromeでYouTube IFrameと字幕同期
2. 30分動画のジョブ分割と処理時間
3. 単語時刻とフレーズリピート
4. Google／Appleログイン
5. Web Pushの端末差
6. 音声録音・認識・一時削除
7. IndexedDBオフラインと再同期
8. iPad／PC 2カラム
9. RTL＋学習字幕の混在

## 15. 未確定

- 実際のクラウドベンダー
- 認証サービス
- ASR、翻訳、LLM、TTSのプロバイダー
- 字幕供給経路
- React NativeかFlutterか
- 月額プランと解析枠
- 地域別のデータ保管要件
