---
document: learner-model-data-analytics-spec
version: 0.2
status: draft-for-review
created: 2026-09-05
updated: 2026-09-05
owner: LilQ
related: 17_パイロットMVP要件定義_v0.2.md
---

# Lingoflow Learner Model・データ・計測仕様 v0.2

## 1. 目的

初期Learner Modelは、AIが習得を断定する仕組みではない。ユーザーの回答履歴から、次回の字幕補助と復習時期を再現可能なルールで決める。

## 2. 学習単位

初期の追跡単位は単語ではなく、教材側で登録した「表現」とする。

例：`to go`、`I ended up ...ing`、`I'm down for that.`

同じ綴りでも意味や用法が違う場合は別の表現IDにする。各表現は元動画のセリフと時間範囲へ結びつける。

## 3. 状態

| 内部状態 | 意味 | 標準の字幕 |
|---|---|---|
| `new` | まだ判定材料がない | Full |
| `supported` | 意味の補助が必要 | Full |
| `practicing` | ヒントがあれば扱える | Hint |
| `independent_candidate` | 補助なしを試せる | English |
| `independent` | 別日に複数回、補助なしで確認 | English |

画面では内部状態名を見せず、「日本語つき」「ヒントだけ」「英語だけ」のように表示する。

## 4. 記録する観測

### 状態更新に使う

- 穴埋めの正誤
- ヒントを使ったか
- 答えを表示したか
- 発話認識で対象表現が含まれたか
- 文字入力で対象表現が含まれたか
- ユーザーの自己申告
- 翌日以降の復習結果
- 全訳を再表示したか

### 参考として記録するが、単独では習得判定に使わない

- 意味を開かなかった
- 動画を止めなかった
- 同じ場面を繰り返した
- 字幕を見ていた時間
- 動画の完走

「操作しなかった」は理解できたことの証拠とは限らないためである。

## 5. v0.1状態更新ルール

優先順位は、ユーザー修正 ＞ 翌日以降の結果 ＞ 当日の結果 ＞ 受動的な視聴行動とする。

```text
初回表示                         → new
意味を見る／答えを見る           → supported
当日、ヒントありで正答           → practicing
別日、ヒントなしで正答           → independent_candidate
さらに別日、ヒントなしで正答     → independent
ヒントを使う／訳を戻す／不正解   → 1段階サポートを増やす
ユーザーが「まだ難しい」を選ぶ   → supported
ユーザーが「できた」を選ぶ       → practicing以上。ただし1回でindependentにしない
```

発話認識の失敗だけでは状態を下げない。端末、騒音、認識サービスの誤りが混ざるため、自己申告または文字入力へ切り替える。

## 6. 復習スケジュール v0.1

| 結果 | 次回候補 |
|---|---|
| 答え表示／不正解 | 翌日 |
| ヒントあり正解 | 2日後 |
| ヒントなし正解 | 4日後 |
| 別日に2回ヒントなし正解 | 7日後 |
| 7日後もヒントなし正解 | 14日後 |

一日の復習上限は5表現とし、期限超過を責める表示はしない。検証後にFSRSなどの導入を判断する。

## 7. データモデル案

### Content

```text
Video
- video_id
- title
- duration_sec
- source_type
- source_url
- rights_status
- ai_processing_allowed
- clip_storage_allowed
- thumbnail_use_allowed
- caption_version
- published_at
- transcript_analysis_status
- vocabulary_profile_version
- speech_rate_wpm
- difficulty_features

CaptionSegment
- segment_id
- video_id
- start_sec
- end_sec
- source_text
- translated_text
- caption_source_type
- caption_version

Expression
- expression_id
- canonical_form
- meaning_ja
- usage_note_ja
- segment_id
- phrase_start_sec
- phrase_end_sec
- replay_preroll_ms
- level_tag
- topic_tags
- reviewed_at
```

### Learner

```text
LearnerProfile
- user_id
- ui_language
- learning_language
- selected_goals
- selected_topics
- consent_version

ExpressionProgress
- user_id
- expression_id
- state
- support_mode
- last_result
- last_reviewed_at
- next_review_at
- user_override

VideoComprehensionEstimate
- user_id
- video_id
- estimate_percent
- estimate_band
- known_token_ratio
- grammar_support_score
- speech_rate_score
- caption_quality_score
- confidence_level
- learner_model_version
- caption_version
- calculated_at

PracticeAttempt
- attempt_id
- user_id
- expression_id
- activity_type
- result
- hint_used
- answer_revealed
- occurred_at
- model_version
```

録音ファイル、認識全文、自由入力全文は、P0の学習履歴に保存しない。必要になった場合は目的、保持期間、削除、同意を別途設計する。

## 8. イベント計測

イベント名と主要プロパティを限定し、本文を送信しない。

| イベント | 目的 | 送る項目例 |
|---|---|---|
| `lesson_impression` | おすすめ表示 | lesson_id, support_mode |
| `recommendation_impression` | 推薦品質 | video_id, rank, estimate_band, reason_codes |
| `search_submitted` | 検索需要 | query_category, result_count。生の検索語は初期保存しない |
| `estimate_detail_opened` | 数値の理解 | video_id, estimate_band, confidence_level |
| `lesson_started` | 開始率 | lesson_id, entry_point |
| `segment_replayed` | 再生支援の利用 | lesson_id, segment_id |
| `phrase_replayed` | フレーズ巻き戻しの利用 | expression_id, replay_mode, replay_count |
| `youtube_url_submitted` | 新規動画追加 | normalized_video_id, entry_point |
| `video_processing_state_changed` | 追加処理の把握 | video_id, from_state, to_state, reason_code |
| `meaning_opened` | 意味確認 | lesson_id, expression_id |
| `practice_started` | 練習到達 | expression_id, activity_type |
| `practice_completed` | 完了率 | expression_id, result, hint_used |
| `input_mode_changed` | 発話障壁 | from_mode, to_mode |
| `review_started` | 翌日復帰 | due_count, entry_point |
| `review_completed` | 定着確認 | result, hint_used, days_since_last |
| `support_changed` | 適応字幕の結果 | from_mode, to_mode, reason_code |
| `lesson_completed` | 一周完了 | lesson_id, expressions_completed |

禁止するイベントプロパティ：字幕本文、訳文、録音、音声認識全文、ユーザーが作った自由文、メールアドレス、氏名。

## 8.1 推定理解度 v0.1

推定理解度はテスト得点ではなく、字幕解析とLearner Modelから計算する視聴前予測である。画面では必ず「推定理解度」と表示する。

```text
base = 既知語・既知表現が字幕トークンに占める重み付き割合
adjustment = 文法難度 + 話速 + 文長 + 字幕品質 + アクセント情報の不足
estimate = 0〜100へ丸めた(base - adjustment)
```

初期は既知語率を中心にするが、同じ単語でも連語や文法で理解できないため「理解度そのもの」と断定しない。十分な字幕がない動画、ユーザー履歴が少ない場合、字幕品質が低い場合は信頼度を下げる。

| 信頼度 | 表示 |
|---|---|
| high | `推定理解度 84%` |
| medium | `推定理解度 70〜80%` |
| low | `推定にはもう少し学習データが必要です` |

推定詳細では「知っている表現が多い」「話す速度が少し速い」「新しい表現が3個」など、ユーザーが動画を選ぶのに使える理由を最大3件表示する。

## 9. コンテンツ審査状態

`rights_status` は最低限、次を区別する。

- `pending`：確認中。パイロット配信不可
- `internal_only`：社内技術確認のみ
- `pilot_approved`：指定パイロットで利用可能
- `public_approved`：公開条件を確認済み
- `blocked`：利用不可

権利状態は動画本体、字幕、翻訳、音声抜粋、サムネイルで異なる場合があるため、必要に応じてAsset単位へ分割する。

動画には処理状態も持たせる。

```text
submitted → metadata_checked → caption_checked → processing
          → ready / watch_only / blocked / failed
```

YouTube動画IDと字幕版を解析キャッシュのキーに含める。動画の公開状態や字幕が変わった場合に古い教材を出し続けないよう、最終確認時刻と再確認予定を記録する。

## 10. AI処理の境界

### 事前処理で使える候補

- 字幕の翻訳案
- 表現候補の抽出
- 日本語の短い解説案
- 穴埋めと発話プロンプト案

すべて教材版にひもづけ、人が確認してから配信する。モデル名、プロンプト版、生成日、レビュー日を記録する。

### 実行時

P0では、自由文へのLLMフィードバックを必須にしない。音声認識を使う場合も、対象表現が含まれるかの補助判定に限定し、発音能力を断定しない。

## 11. 検証と変更管理

- `model_version` をすべての状態更新に記録する
- ルール変更前後の結果を混ぜずに比較できるようにする
- 手動修正の理由コードを残す
- データ欠損時は推定で状態を上げない
- パイロット終了後、ユーザーが自分の学習履歴と録音の削除を依頼できるようにする

## 12. 実装前に確定する事項

- 匿名ユーザーIDとログインの要否
- 端末内保存とクラウド保存の境界
- 利用する分析基盤と送信先リージョン
- 音声認識方式、送信データ、保持方針、費用上限
- 通知時刻とOS権限の取得タイミング
- 教材データの更新・差し戻し方法
- 動画の非公開化・字幕変更・埋め込み禁止を再確認する周期
- パイロット終了時のデータ削除手順
