# Miraa 使用技術・Flutterパッケージ記録

> Miraaアプリ内の「謝辞（Acknowledgements）」画面のスクリーンショットから確認できたパッケージを記録したものです。
>
> **注意:**
> ここにパッケージが掲載されていることは「アプリまたは依存ライブラリに含まれている」ことを示しますが、Miraaが各パッケージをどの機能で直接利用しているかまでは、この画面だけでは断定できません。

## 今回の画像から分かる大きな技術構成

-   **Flutter / Dart系のアプリ**
-   **YouTube再生・取得系**
    -   `youtube_explode_dart`
    -   `youtube_player_flutter`
-   **音声録音**
    -   `record` と各プラットフォーム実装
-   **アプリ内課金・サブスクリプション**
    -   `purchases_flutter`
-   **ローカルデータ保存**
    -   `sqflite`
    -   `shared_preferences`
-   **リアルタイム/非同期通信**
    -   `web_socket_channel`
    -   `stream_channel`
    -   `stream_transform`
    -   `rxdart`
-   **Podcast / RSS**
    -   `podcast_search`
    -   `rss_dart`
-   **URL・外部リンク**
    -   `url_launcher`
-   **UI / スクロール / 表示制御**
    -   `scrollable_positioned_list`
    -   `scroll_to_index`
    -   `visibility_detector`
    -   `smooth_corner`
    -   `photo_view`
    -   `vector_graphics`
-   **画面スリープ防止**
    -   `wakelock_plus`

------------------------------------------------------------------------

# パッケージ一覧

## YouTube

### `youtube_explode_dart`

> A port in dart of the youtube explode library. Supports several API
> functions without the need of Youtube API Key.

Dart版のYouTube Explodeライブラリ。YouTube API
Keyを使わずに複数のYouTube関連機能を扱うためのパッケージ。

**Miraaとの関連が特に注目される技術。**

### `youtube_player_flutter`

> Flutter plugin for playing or streaming inline YouTube videos using
> the official iFrame player API. This plugin supports both Android and
> iOS.

公式iFrame Player
APIを利用して、Flutterアプリ内でYouTube動画を再生・ストリーミングするためのプラグイン。

------------------------------------------------------------------------

## 音声録音

### `record`

> Audio recorder from microphone to a given file path with multiple
> codecs, bit rate and sampling rate options.

マイク音声をファイルへ録音するためのパッケージ。複数のコーデック、ビットレート、サンプリングレートに対応。

### `record_linux`

Linux向け`record`実装。

### `record_macos`

macOS向け`record`実装。

### `record_platform_interface`

`record`の共通プラットフォームインターフェース。

### `record_web`

Web向け`record`実装。

### `record_windows`

Windows向け`record`実装。

------------------------------------------------------------------------

## 課金・サブスクリプション

### `purchases_flutter`

> Flutter in-app purchases and subscriptions made easy. The plugin
> supports iOS, macOS and Android.

Flutterでアプリ内課金・サブスクリプションを扱うためのパッケージ。iOS、macOS、Android対応。

------------------------------------------------------------------------

## データ保存

### `sqflite`

> Flutter plugin for SQLite, a self-contained, high-reliability,
> embedded, SQL database engine.

FlutterからSQLiteを利用するためのプラグイン。

### `sqflite_common`

SQLiteをDartから扱うための共通ラッパー。

### `shared_preferences`

> Flutter plugin for reading and writing simple key-value pairs. Wraps
> NSUserDefaults on iOS and SharedPreferences on Android.

簡単なKey-Valueデータを端末に保存・読み込みするためのFlutterプラグイン。

### `shared_preferences_android`

Android実装。

### `shared_preferences_foundation`

iOS / macOS実装。

### `shared_preferences_linux`

Linux実装。

### `shared_preferences_platform_interface`

共通プラットフォームインターフェース。

### `shared_preferences_web`

Web実装。

### `shared_preferences_windows`

Windows実装。

------------------------------------------------------------------------

## 通信・非同期処理

### `web_socket_channel`

> StreamChannel wrappers for WebSockets. Provides a cross-platform
> WebSocketChannel API.

WebSocket通信をクロスプラットフォームで扱うためのパッケージ。

### `stream_channel`

Dart Streamをベースにした双方向通信チャンネルの抽象化。

### `stream_transform`

Streamを変換・操作するためのユーティリティ。

### `rxdart`

ReactiveX APIをDart
Streams上で利用するための非同期プログラミングライブラリ。

### `shelf_web_socket`

`shelf`でWebSocket接続を扱うためのハンドラー。

### `shelf`

Webサーバー用ミドルウェアを構成するためのモデル。

### `pool`

ファイルシステムやネットワークリクエストなど、有限リソースの同時利用を制御するためのパッケージ。

### `queue`

複数ソースからのFutureをキューに入れて処理するためのパッケージ。

### `synchronized`

非同期コードへの同時アクセスを防ぐロック機構。

------------------------------------------------------------------------

## Podcast / RSS

### `podcast_search`

Podcastの検索、Podcast
RSSフィードの解析、エピソード情報取得のためのライブラリ。画面上の説明ではiTunesとPodcastIndex（preview）をサポート。

### `rss_dart`

RSS1.0 / RSS2.0 / Atomを解析するRSSパーサー。

------------------------------------------------------------------------

## URL・外部アプリ連携

### `url_launcher`

Web、電話、SMS、メールなどのURLスキームを起動するFlutterプラグイン。

### `url_launcher_android`

Android実装。

### `url_launcher_ios`

iOS実装。

### `url_launcher_linux`

Linux実装。

### `url_launcher_macos`

macOS実装。

### `url_launcher_platform_interface`

共通プラットフォームインターフェース。

### `url_launcher_web`

Web実装。

### `url_launcher_windows`

Windows実装。

------------------------------------------------------------------------

## UI・表示・スクロール

### `scrollable_positioned_list`

リスト内の特定アイテムへプログラムからスクロールするためのリスト。

### `scroll_to_index`

スクロール可能なWidget内の特定の子要素へスクロールするためのパッケージ。

### `visibility_detector`

子Widgetが画面上に表示されているかを検出し、コールバックを通知するWidget。

### `smooth_corner`

Figmaのような可変スムーズネスを持つ角丸矩形ボーダー。

### `photo_view`

ジェスチャー操作によるズームに対応した画像表示Widget。SVGなどの表示にも利用可能。

### `transparent_image`

Dartコード内で`Uint8List`として表現された透明画像。

### `vector_graphics`

Flutter向けベクターグラフィックス描画パッケージ。

### `vector_graphics_codec`

`vector_graphics`向けエンコードライブラリ。

### `vector_graphics_compiler`

`vector_graphics`向けコンパイラ。

### `vector_math`

2D / 3Dアプリケーション向けVector Mathライブラリ。

------------------------------------------------------------------------

## 画面スリープ制御

### `wakelock_plus`

Android、iOS、macOS、Windows、Linux、Webで、端末画面がスリープしないよう維持するためのプラグイン。

### `wakelock_plus_platform_interface`

`wakelock_plus`の共通プラットフォームインターフェース。

------------------------------------------------------------------------

## ファイル・パス

### `path`

Windows、POSIX（Linux / macOS）、Webをサポートするパス操作ライブラリ。

### `path_parsing`

SVG Pathの解析・コード生成を支援するDartライブラリ。Flutter SVGで利用。

### `path_provider`

一時ディレクトリやアプリデータディレクトリなど、各OSで一般的に使われるファイル保存場所を取得するFlutterプラグイン。

### `path_provider_android`

Android実装。

### `path_provider_foundation`

iOS / macOS実装。

### `path_provider_linux`

Linux実装。

### `path_provider_platform_interface`

共通プラットフォームインターフェース。

### `path_provider_windows`

Windows実装。

### `watcher`

ディレクトリ内のファイル追加・削除・変更などを監視するファイルシステムWatcher。

### `xdg_directories`

LinuxのXDGディレクトリ設定情報を読み込むDartパッケージ。

------------------------------------------------------------------------

## Windows関連

### `win32`

FFIを利用して一般的なWin32
APIへアクセスするDartライブラリ。Cコンパイラ不要。

### `win32_registry`

Windows RegistryへアクセスするためのDart API。

------------------------------------------------------------------------

## データ形式・解析

### `xml`

XMLドキュメントの解析、走査、クエリ、変換、生成を行う軽量ライブラリ。

### `yaml`

YAMLのパーサー。

### `typed_data`

`dart:typed_data`に関連するユーティリティ関数・クラス。

### `string_scanner`

パターン列を利用して文字列を解析するクラス。

### `petitparser`

効率的な文法・パーサーを構築するための動的Parser Framework。

### `protobuf`

Protocol
Buffersのランタイムライブラリ。`.proto`から生成されたDartコードで利用。

### `pubspec_parse`

`pubspec.yaml`を型安全なAPIで解析するパッケージ。

### `pub_semver`

pubのバージョニングポリシーに基づくバージョン・バージョン制約を扱うパッケージ。

------------------------------------------------------------------------

## Dart / Flutter開発支援

### `platform`

差し替え・モック可能なプラットフォーム情報抽象化。

### `plugin_platform_interface`

Flutter Federated Plugin向けの再利用可能なPlatform Interface基底クラス。

### `source_gen`

Dart Build System向けソースコード生成Builder / Utility。

### `source_helper`

Dartソースコード生成を支援するユーティリティ。

### `source_span`

ソースコード内の位置・範囲を表現する標準的な仕組み。

### `stack_trace`

Stack Traceを操作し、読みやすく表示するためのパッケージ。

### `test_api`

Dartテストの構造化・Expectation確認用API。

### `timing`

同期・非同期処理のパフォーマンス計測用パッケージ。

### `quick_log`

Dart向けの拡張可能なLoggingパッケージ。

### `reCase`

入力文字列を希望するCase Conventionへ変換するパッケージ。

### `sprintf`

Dart版sprintf形式の文字列フォーマット。

### `term_glyph`

Unicode GlyphとASCII代替文字を扱うユーティリティ。

### `uuid`

RFC4122 UUIDの生成・解析を行うDartパッケージ。

### `quiver`

Dart標準ライブラリを便利にする各種Utility Library群。

### `pointycastle`

暗号アルゴリズム・暗号Primitiveを実装するDartライブラリ。

------------------------------------------------------------------------

# 今回の画像から特に重要そうな技術

Miraaのような動画語学学習アプリを考えるうえで、今回確認できた中では以下が特に参考になる。

  -----------------------------------------------------------------------
  目的                                   確認できた技術
  -------------------------------------- --------------------------------
  Flutterアプリ内でYouTubeを再生         `youtube_player_flutter`

  YouTube関連データへのアクセス          `youtube_explode_dart`

  ユーザーの発話を録音                   `record`

  字幕リストなどを現在位置へスクロール   `scrollable_positioned_list`,
                                         `scroll_to_index`

  ローカルDB                             `sqflite`

  簡易設定・状態保存                     `shared_preferences`

  サブスクリプション                     `purchases_flutter`

  WebSocket通信                          `web_socket_channel`

  非同期状態・Stream処理                 `rxdart`, `stream_transform`

  動画視聴中の画面スリープ防止           `wakelock_plus`

  Podcastコンテンツ                      `podcast_search`, `rss_dart`

  ファイル保存場所の管理                 `path_provider`
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 今後の追加記録

このファイルは、追加の「謝辞」スクリーンショットから確認できたパッケージを追記していく。

## 追加時に確認するポイント

-   パッケージ名

-   公式説明として画面に表示されている用途

-   Miraaのどの機能に関係しそうか

-   自分のアプリでも参考になりそうか

-   ## 動画 / 字幕 / AI / 音声 / データ保存 / 課金 / UIなどの分類

# 追加記録 02

以下は、追加で提供された「謝辞」スクリーンショットから確認できたパッケージ。

## Firebase / バックエンド

### `firebase_auth`

Firebase
AuthenticationをFlutterから利用するためのプラグイン。パスワード、電話番号、GoogleなどのIdentity
Providerを利用した認証に対応。

### `firebase_auth_platform_interface`

`firebase_auth`の共通プラットフォームインターフェース。

### `firebase_auth_web`

`firebase_auth`のWeb実装。

### `firebase_core`

FlutterアプリをFirebaseへ接続するためのFirebase
Coreプラグイン。複数Firebase Appへの接続にも対応。

### `firebase_core_platform_interface`

`firebase_core`の共通プラットフォームインターフェース。

### `firebase_core_web`

`firebase_core`のWeb実装。

### `firebase_crashlytics`

Firebase
Crashlytics用Flutterプラグイン。捕捉されなかったエラーなどをFirebase
Consoleへ報告する。

### `firebase_crashlytics_platform_interface`

`firebase_crashlytics`の共通プラットフォームインターフェース。

### `firebase_messaging`

Firebase Cloud Messaging（FCM）をFlutterから利用するプラグイン。Android
/ iOSへのメッセージ・Push通知配信に利用できる。

### `firebase_messaging_platform_interface`

`firebase_messaging`の共通プラットフォームインターフェース。

### `firebase_messaging_web`

`firebase_messaging`のWeb実装。

### `firebase_remote_config`

Firebase Remote
Config用Flutterプラグイン。アプリを再リリースせずに、見た目や挙動などの設定値を変更する用途に使える。

### `firebase_remote_config_platform_interface`

`firebase_remote_config`の共通プラットフォームインターフェース。

### `firebase_remote_config_web`

`firebase_remote_config`のWeb実装。

### `firebase_storage`

Firebase Cloud StorageをFlutterから利用するためのプラグイン。Android /
iOSなどからオブジェクトファイルを保存・取得する用途。

### `firebase_storage_platform_interface`

`firebase_storage`の共通プラットフォームインターフェース。

### `firebase_storage_web`

`firebase_storage`のWeb実装。

### この構成から分かること

今回の画像だけでも、MiraaにはFirebase系のかなり本格的な構成が含まれていることが分かる。

-   ユーザー認証 → `firebase_auth`
-   Firebase初期化 → `firebase_core`
-   クラッシュ監視 → `firebase_crashlytics`
-   Push通知 → `firebase_messaging`
-   サーバー側からアプリ設定変更 → `firebase_remote_config`
-   ファイル保存 → `firebase_storage`

ただし、謝辞に含まれることだけでは「各機能をMiraaが現在どの程度直接利用しているか」までは断定できない。

------------------------------------------------------------------------

## Googleログイン / 言語判定

### `google_mlkit_commons`

Google ML
KitをFlutterモバイルアプリで利用するための共通ファイルを提供するプラグイン。

### `google_mlkit_language_id`

Google ML Kit Language
IdentificationをFlutterから利用するプラグイン。文字列が何語で書かれているかを判定する。

**語学学習アプリとして特に重要。**

字幕や文章を受け取った際に、

`入力テキスト → 言語判定 → 英語 / 韓国語 / 日本語 / 中国語 ...`

のような処理を構築できる。

### `google_sign_in`

GoogleアカウントによるログインをFlutterで実装するためのプラグイン。

### `google_sign_in_android`

Android実装。

### `google_sign_in_ios`

iOS実装。

### `google_sign_in_platform_interface`

共通プラットフォームインターフェース。

### `google_sign_in_web`

Web向けGoogle Sign-In実装。

### `google_identity_services_web`

Google Identity ServicesをDart / Webから利用するためのJS
Interopレイヤー。

------------------------------------------------------------------------

## 多言語・ローカライズ

### `intl`

国際化・ローカライズされたメッセージ、日付、数値フォーマット、双方向テキストなどを扱うDartライブラリ。

### `intl_utils`

ARBファイルからDartのLocalizationコードを生成するライブラリ。

### `i18n`

Dart /
Flutter向けのシンプルな国際化ソリューション。コード生成によって翻訳をDart
Classとして扱える。

### `kana_kit`

ひらがな、カタカナ、ローマ字の検出・相互変換を行うDartライブラリ。

**日本語学習・日本語字幕処理との関連が考えられる技術。**

### 多言語対応との関係

今回確認できた

-   `google_mlkit_language_id`
-   `intl`
-   `intl_utils`
-   `i18n`
-   `kana_kit`

という組み合わせから、少なくともアプリの技術構成には「複数言語を扱うための仕組み」が含まれている。

これは、こちらで考えている

`動画 → 字幕 → 言語判定 → 学習者の母語へ翻訳 → 学習`

という設計にもかなり参考になる。

------------------------------------------------------------------------

## ローカルデータベース

### `hive`

Pure Dartで実装された軽量・高速なKey-Value
Database。画面上の説明ではAES-256による暗号化にも言及されている。

### `hive_flutter`

HiveをFlutterアプリで扱いやすくする拡張。

### `hive_generator`

任意のClassをHiveへ保存するためのTypeAdapterを自動生成する拡張。

### Miraaで考えられる用途

謝辞だけでは実際の用途は断定できないが、技術的には例えば以下のローカル保存に適している。

-   字幕データ
-   学習履歴
-   動画履歴
-   保存フレーズ
-   ユーザー設定
-   一時キャッシュ

前回確認した`shared_preferences`や`sqflite`も含まれているため、用途に応じて複数のローカル保存方式を使い分けられる構成になっている可能性がある。

------------------------------------------------------------------------

## HTTP / Web通信

### `http`

複数プラットフォームで利用できるFutureベースのHTTP Request API。

### `http_multi_server`

複数ServerからのRequestを処理する`dart:io HttpServer`ラッパー。

### `http_parser`

HTTP形式の解析・Serializationを行うプラットフォーム非依存パッケージ。

### `html`

Browser外でHTML Contentを解析・操作するためのAPI。

------------------------------------------------------------------------

## JSON / データモデル

### `json_annotation`

`json_serializable`を利用したJSON Code Generationを支援するClass・Helper
Function。

### `json_serializable`

Dart
ClassへAnnotationを付けることで、JSONとの相互変換コードを自動生成する。

例えば字幕データを、

``` json
{
  "start": 12.4,
  "end": 15.8,
  "text": "I was thinking about going to Japan."
}
```

のようなJSONとしてサーバーから受け取り、Dart
Objectへ変換する構成に利用できる。

### `js`

JavaScript API用の静的Dart Interfaceを作成するためのAnnotation。

------------------------------------------------------------------------

## Flutter本体 / UI

### `flutter`

Flutter Applicationを書くためのFramework本体。

### `flutter_adaptive_scaffold`

Navigation Elementなどを含むAdaptive
Layoutを簡単に構築するためのWidget群。

### `flutter_cache_manager`

Web Fileを端末Storageへ保存する汎用Cache
Manager。Cache情報の保存に`sqflite`を利用する。

### `flutter_chat_types`

`flutter_chat_ui`などで共有されるType Declarationを含むUtility Library。

### `flutter_chat_ui`

Community-drivenなFlutter Chat UI実装。Firebase
BaaSをオプションで利用可能。

### `flutter_inappwebview`

Inline WebView、Headless WebView、アプリ内Browser
WindowなどをFlutterへ追加するプラグイン。

### `flutter_link_previewer`

Textに含まれるURLなどからカスタマイズ可能なLink
Previewを生成するパッケージ。CacheからのRenderにも対応。

### `flutter_linkify`

Text内のURLやEmailをクリック可能なInline Linkへ変換する。

### `flutter_lints`

Flutterアプリ・Package・Plugin向け推奨Lint Rules。

### `flutter_oss_licenses`

`pubspec.yaml` / `pubspec.lock`からOSS License Listを生成するTool。

**今回見ている「謝辞」画面自体の生成にも関係している可能性があるパッケージ。**

### `flutter_parsed_text`

Textを解析し、複数のFlutter Text Widgetへ分割して扱うためのパッケージ。

字幕中のURL・特定Pattern・単語などを部分的に異なるWidgetとして扱う用途にも応用可能。

------------------------------------------------------------------------

## セキュア保存

### `flutter_secure_storage`

Keychain（iOS）やKeyStoreベースの仕組み（Android）を利用してデータをSecure
Storageへ保存するFlutter API。

認証Tokenなど、通常の`shared_preferences`へそのまま保存したくない情報に適している。

### `flutter_secure_storage_linux`

Linux実装。

### `flutter_secure_storage_macos`

macOS実装。

### `flutter_secure_storage_platform_interface`

共通プラットフォームインターフェース。

### `flutter_secure_storage_web`

Web実装。

### `flutter_secure_storage_windows`

Windows実装。

------------------------------------------------------------------------

## 動画再生

### `flutter_vlc_player`

VLCを利用したFlutter向けVideo
Player。Flutter標準系の`video_player`に対する代替手段で、1画面上で複数Playerを扱う機能にも言及されている。

### `flutter_vlc_player_platform_interface`

`flutter_vlc_player`の共通プラットフォームインターフェース。

### 注目ポイント

前回確認した

-   `youtube_player_flutter`
-   `youtube_explode_dart`

に加えて、

-   `flutter_vlc_player`

も存在する。

したがって技術構成上は、**YouTube専用Playerだけではなく、一般的なMedia
Stream / Video Fileを再生するためのPlayerも含まれている**ことが分かる。

これはMiraaがYouTube以外の動画・音声ソースも扱う設計と整合的。ただし、実際にどのMedia
TypeでVLC Playerを使っているかは謝辞だけでは断定できない。

------------------------------------------------------------------------

## SVG / グラフィック

### `flutter_svg`

FlutterでSVG 1.1 Fileを描画・表示するためのWidget Library。

------------------------------------------------------------------------

## Dartコード生成 / モデル

### `freezed_annotation`

Freezed Code Generator用Annotation。

ImmutableなData ClassやState Modelなどを作る際に使われる。

### `frontend_server_client`

Dart SDKの`frontend_server` Compilerを起動・操作するClient Code。

### `glob`

Bash形式のFile / Directory Glob Patternを扱うLibrary。

### `graphs`

任意のGraph表現に対して動作するGraph Algorithm群。

------------------------------------------------------------------------

## リストUI

### `grouped_list`

List ItemをSectionごとにGroup化できるFlutter ListView。

学習履歴、単語帳、日付別履歴などのGrouped UIに利用可能。

------------------------------------------------------------------------

## リンク解析

### `linkify`

Text、URL、Email、電話番号、User Tagなどを解析するLow-level Dart
Library。

------------------------------------------------------------------------

## Logging / Debug

### `logger`

小さく扱いやすい拡張可能なLogger。読みやすいLog表示を行う。

### `logging`

DebugやError LoggingのためのAPI。

### `matcher`

Test ExpectationをMatcher Classで記述するためのSupport Package。

### `meta`

Static Analysisだけでは表現できないDeveloper
IntentionをAnnotationで表現するためのPackage。

------------------------------------------------------------------------

## Material Design

### `material_color_utilities`

Material Design 3のColor Systemを支えるAlgorithm /
Utility。画像からTheme Colorを選択したり、Color
Toneを生成したりする用途を持つ。

------------------------------------------------------------------------

## MIME / ファイル種別

### `mime`

File ExtensionやFile ContentからMIME Typeを判定するなど、Media
Typeを扱うUtility。

動画・音声・画像など複数種類のFileをImportするアプリでは重要になり得る。

------------------------------------------------------------------------

## App情報

### `package_config`

Dart Package Configuration Fileを読み書きするためのSupport。

### `package_info_plus`

iOSの`CFBundleVersion`やAndroidの`versionCode`など、Application
Package情報を取得するFlutter Plugin。

### `package_info_plus_platform_interface`

`package_info_plus`の共通プラットフォームインターフェース。

------------------------------------------------------------------------

## メール

### `mailto`

Flutter App内で`mailto:` Linkを生成するためのシンプルなDart Package。

------------------------------------------------------------------------

## アプリ内課金

### `in_app_purchase`

App Store / Google Playを通じたアプリ内課金を行うFlutter Plugin。

### `in_app_purchase_android`

Android BillingClient APIを利用するAndroid実装。

### `in_app_purchase_platform_interface`

共通プラットフォームインターフェース。

### `in_app_purchase_storekit`

StoreKit Frameworkを利用するiOS / macOS実装。

### 課金構成について

前回確認した`purchases_flutter`に加えて、Flutter公式系の`in_app_purchase`も含まれている。

したがって、謝辞上では少なくとも

-   `purchases_flutter`
-   `in_app_purchase`

の両方の課金関連Packageが確認できる。

ただし、現在のMiraaがどちらを主経路として利用しているか、あるいは依存関係として含まれているだけなのかは、この情報だけでは断定できない。

------------------------------------------------------------------------

# 今回の追加で特に重要な発見

  機能領域           確認できた主要技術                        自分たちのアプリへの重要度
  ------------------ ---------------------------------------- ----------------------------
  アプリ基盤         `flutter`                                           ★★★★★
  ユーザー認証       `firebase_auth`, `google_sign_in`                   ★★★★★
  言語自動判定       `google_mlkit_language_id`                          ★★★★★
  多言語UI           `intl`, `intl_utils`, `i18n`                        ★★★★★
  日本語処理         `kana_kit`                                          ★★★★☆
  動画再生           `flutter_vlc_player`                                ★★★★★
  ローカルDB         `hive`, `sqflite`                                   ★★★★★
  API通信            `http`                                              ★★★★★
  JSONデータ         `json_serializable`                                 ★★★★★
  Secure Token保存   `flutter_secure_storage`                            ★★★★★
  Cloud Storage      `firebase_storage`                                  ★★★★☆
  Push通知           `firebase_messaging`                                ★★★★☆
  Remote Config      `firebase_remote_config`                            ★★★☆☆
  Error監視          `firebase_crashlytics`                              ★★★★☆
  課金               `purchases_flutter`, `in_app_purchase`              ★★★★★
  字幕Text UI候補    `flutter_parsed_text`                               ★★★★☆
  Cache              `flutter_cache_manager`                             ★★★★☆
  WebView            `flutter_inappwebview`                              ★★★☆☆

------------------------------------------------------------------------

# 現時点で見えてきたMiraaの技術構成

これまでのスクリーンショットをまとめると、少なくとも依存パッケージ上は次のような構成が見えてくる。

``` text
Flutter / Dart
│
├─ Video / Media
│  ├─ youtube_player_flutter
│  ├─ youtube_explode_dart
│  ├─ flutter_vlc_player
│  └─ wakelock_plus
│
├─ Subtitle / Language
│  ├─ google_mlkit_language_id
│  ├─ kana_kit
│  ├─ intl / i18n
│  ├─ flutter_parsed_text
│  └─ scrollable_positioned_list
│
├─ Audio / Speaking
│  └─ record
│
├─ Local Data
│  ├─ hive
│  ├─ sqflite
│  ├─ shared_preferences
│  └─ flutter_secure_storage
│
├─ Backend / Cloud
│  ├─ Firebase Core
│  ├─ Firebase Auth
│  ├─ Firebase Storage
│  ├─ Firebase Messaging
│  ├─ Firebase Remote Config
│  └─ Firebase Crashlytics
│
├─ Network
│  ├─ http
│  ├─ web_socket_channel
│  └─ rxdart
│
├─ Account
│  └─ google_sign_in
│
└─ Monetization
   ├─ purchases_flutter
   └─ in_app_purchase
```

## 自分たちのアプリ設計へ置き換えると

この技術構成は、現在考えている動画語学学習アプリの土台としてかなり参考になる。

``` text
ユーザー
   ↓
Flutter App
   ↓
ログイン / 学習レベル / 学習言語
   ↓
テーマ選択
   ↓
動画提案
   ↓
YouTube / Video Player
   ↓
字幕取得 or AI文字起こし
   ↓
言語判定
   ↓
字幕同期
   ↓
現在レベルに応じて既知語を隠す
   ↓
+1レベルのフレーズを抽出
   ↓
アウトプット練習
   ↓
ローカルDB + Cloudへ学習履歴保存
   ↓
分散学習による復習
```

このうち、今回のMiraaの謝辞から直接確認できるのは主に**アプリ基盤・動画・言語判定・保存・通信・認証・課金などの技術要素**であり、「レベル診断」「理解度％」「+1フレーズ選定」「分散学習アルゴリズム」そのものがMiraaに実装されていることを示すものではない。

------------------------------------------------------------------------

# 追加記録 03（最終）

以下は最後に提供された「謝辞」スクリーンショットから確認できたパッケージ。前の記録と重複するパッケージについても、今回確認できた役割を補足している。

## 音声・メディア処理

### `audio_service`

Flutterでバックグラウンド音声再生を実装するためのプラグイン。画面OFF時などでも音声再生を継続できる。

### `audio_service_platform_interface`

`audio_service`の共通プラットフォームインターフェース。

### `audio_service_web`

`audio_service`のWeb実装。

### `audio_session`

iOSのAudio Session CategoryやAndroidのAudio Attributeを設定し、Audio
Focus、Mixing、Duckingなどの挙動を管理する。

### `audio_video_progress_bar`

音声・動画Streamの現在位置を表示したり、再生位置を変更したりするProgress
Bar Widget。

**動画語学学習アプリとの関連度が非常に高い。**\
字幕と動画の同期、Seek操作、独自Player UIなどを作る際の参考になる。

### `audioplayers`

Flutterで複数のAudio Fileを同時再生できるプラグイン。

### `audioplayers_android`

Android実装。

### `audioplayers_darwin`

iOS / macOS実装。

### `audioplayers_linux`

Linux実装。

### `audioplayers_platform_interface`

共通プラットフォームインターフェース。

### `audioplayers_web`

Web実装。

### `audioplayers_windows`

Windows実装。

------------------------------------------------------------------------

## FFmpeg / 音声変換

### `ffmpeg_kit_flutter_audio`

FlutterからFFmpeg
Kitを利用するためのAudio向けPackage。画像の説明ではAndroid / iOS /
macOSをサポート。

**Miraaの技術構成を考えるうえで特に重要なパッケージ。**

技術的にはFFmpegを利用して、例えば以下のようなMedia処理を実装できる。

-   動画から音声を抽出
-   Audio Codec変換
-   Bitrate / Sample Rate変換
-   Media File変換
-   AI文字起こしへ渡す前のAudio前処理

ただし、謝辞に存在することだけから「MiraaがAI文字起こし時に必ずFFmpegで動画から音声抽出している」とまでは断定できない。

### `ffmpeg_kit_flutter_platform_interface`

`ffmpeg_kit_flutter`系Pluginの共通プラットフォームインターフェース。

### `ffi`

DartからForeign Function Interface（FFI）Codeを扱うためのUtility。

Native Libraryとの連携に利用される。

------------------------------------------------------------------------

## ファイル操作

### `file`

Dart向けFile System Abstraction。Local File SystemだけでなくMemory File
Systemなども扱える。

### `file_picker_writable`

ユーザーがFile /
Documentを開き、読み書きしたり、外部Mediaへ新しいFileを作成したりできるFlutter
Plugin。

MiraaがLocal MediaをImport /
Exportする機能を構築する際に利用可能な技術。

------------------------------------------------------------------------

## Firebase Analytics

### `firebase_analytics`

Google Analytics for FirebaseをFlutterから利用するPlugin。Android /
iOSでのアプリ利用状況やUser Engagement分析に利用する。

### `firebase_analytics_platform_interface`

`firebase_analytics`の共通プラットフォームインターフェース。

### `firebase_analytics_web`

`firebase_analytics`のWeb実装。

### プロダクト改善との関係

例えば語学アプリなら、

-   動画開始率
-   動画完了率
-   字幕タップ率
-   単語保存率
-   復習開始率
-   課金画面到達率

などをEventとして計測し、どこでユーザーが離脱しているか分析する設計に応用できる。

------------------------------------------------------------------------

## Cloud Firestore

### `cloud_firestore`

Firebase Cloud FirestoreをFlutterから利用するPlugin。Cloud-hosted NoSQL
Databaseで、画像の説明ではAndroid / iOSでSynchronizationとOffline
Supportを持つ。

### `cloud_firestore_platform_interface`

`cloud_firestore`の共通プラットフォームインターフェース。

### `cloud_firestore_web`

`cloud_firestore`のWeb実装。

### Miraa型アプリで想定可能な用途

謝辞だけから実際のDatabase
Schemaは分からないが、技術的には以下のようなCloud Data保存に利用できる。

``` text
users
 └─ userId
     ├─ profile
     ├─ settings
     ├─ learningLanguages
     ├─ history
     ├─ savedWords
     └─ progress
```

こちらで考えているアプリなら、

-   ユーザーレベル
-   学習目標
-   学習中の言語
-   動画履歴
-   保存単語
-   保存フレーズ
-   復習予定
-   学習進捗

などを同期する用途が考えられる。

------------------------------------------------------------------------

## HTTP通信

### `dio`

高機能なDart / Flutter HTTP Networking Package。

以下のような機能を持つ。

-   HTTP Request
-   Interceptor
-   Request Cancel
-   Custom Adapter
-   Transformer

前回確認した`http`よりも、より高度なAPI通信処理を構築しやすい。

AI APIや独自Backendとの通信にも利用可能。

------------------------------------------------------------------------

## Device情報

### `device_info_plus`

端末のMaker、Model、Android / iOS Versionなどの詳細情報を取得するFlutter
Plugin。

### `device_info_plus_platform_interface`

共通プラットフォームインターフェース。

------------------------------------------------------------------------

## Linux / Desktop関連

### `dbus`

D-Bus Message Bus ClientのNative Dart実装。Dart ApplicationからLinux
Desktop Serviceへ直接アクセスするためのPackage。

------------------------------------------------------------------------

## List差分計算

### `diffutil_dart`

2つのListの差分をEdit OperationのListとして計算する。

Flutter Listの更新をAnimationさせるなど、効率的なUI更新に利用できる。

------------------------------------------------------------------------

## Dartデータ比較

### `equatable`

`==`や`hashCode`を毎回明示的にOverrideせず、Value-based
Equalityを実装しやすくするDart Package。

------------------------------------------------------------------------

## Testing

### `fake_async`

TimerやMicrotaskなどの非同期EventをFake化し、決定的なTestingを行うためのPackage。

### `boolean_selector`

Boolean Expressionを扱うための柔軟なSyntaxを提供するUtility。

------------------------------------------------------------------------

## Build / Code Generation

### `build`

`build_runner`互換のCode Generatorを作成するためのPackage。

### `build_config`

`build.yaml` ConfigurationのFormat定義・Parsing Support。

### `build_daemon`

Dart Buildを実行するDaemon。

### `build_resolvers`

Builder内でDart CodeをResolveする。

### `build_runner`

Dart Code GenerationおよびModular CompilationのためのBuild System。

### `build_runner_core`

Build Structureを整理しBuilderを実行するCore Tool。

### `built_collection`

Dart SDK CollectionをベースとしたImmutable Collection。

### `built_value`

Builder付きValue Type、Dart
Classを利用したEnum、Serializationなどを提供するRuntime Library。

------------------------------------------------------------------------

## Unicode / 文字列

### `characters`

Unicode / Grapheme Clusterを考慮したString Operationを提供する。

語学アプリでは、単純なCode
Unit単位ではなく「ユーザーから見た文字」の単位でTextを扱う際に重要になる。

------------------------------------------------------------------------

## YAML

### `checked_yaml`

`json_serializable`や`yaml`を利用してYAML
DocumentをDecodeする際、より分かりやすいExceptionを生成する。

------------------------------------------------------------------------

## 時刻

### `clock`

`dart:core`のClock
APIをWrapし、TestingなどでFake化できるようにするPackage。

------------------------------------------------------------------------

## Dartコード生成

### `code_builder`

Builder方式で有効なDart Codeを生成するためのLibrary。

------------------------------------------------------------------------

## Collections

### `collection`

Collectionに関連するUtility Function / Classを提供。

------------------------------------------------------------------------

## データ変換

### `convert`

Data
Representation間の変換Utility。Sink、Codec、Decoder、Encoderなどを提供。

------------------------------------------------------------------------

## Cryptography

### `crypto`

SHA、MD5、HMACなどのCryptographic Function実装。

------------------------------------------------------------------------

## HTML / CSS解析

### `csslib`

CSS（Cascading Style Sheets）を解析・分析するためのLibrary。

前回の`html`と合わせ、Web Contentの解析処理を行える構成になっている。

------------------------------------------------------------------------

## iOS UI

### `cupertino_icons`

Apple StyleのCupertino Widget向けDefault Icon Asset。

------------------------------------------------------------------------

## OSSライセンス

### `dart_pubspec_licenses`

`pubspec.yaml`を利用してDart PackageからOSS
License情報を抽出しやすくするLibrary。

今回調査している「謝辞 / OSS
License」画面そのものを構成する仕組みに関係している可能性がある。

------------------------------------------------------------------------

## Dart Formatter

### `dart_style`

Dart Source Codeの自動Formatter。APIとCLI Toolを提供。

------------------------------------------------------------------------

## Dart / Flutter内部・開発支援

### `_fe_analyzer_shared`

Dartの`front_end`と`analyzer`間で共有されるLogic。

### `_flutterfire_internals`

FlutterFire Plugin間で共有されるDart Codeを格納する内部Package。

### `analyzer`

Dart CodeのStatic Analysisを行うLibrary。

### `archive`

ZIP、TAR、BZip2、GZip、ZLibなど各種Archive / Compression FormatのEncoder
/ Decoder。

### `args`

GNU / POSIX StyleのCommand-line ArgumentをOption /
ValueへParseするLibrary。

### `async`

`dart:async`関連のUtility Function / Class。

------------------------------------------------------------------------

# 最終的に特に重要だったパッケージ

今回までに確認した大量のPackageの中で、**Miraa型の動画語学学習アプリを作るうえで特に参考になるもの**を抜き出すと以下。

  領域               Package                                     重要度
  ------------------ ----------------------------------------- --------
  App Framework      `flutter`                                    ★★★★★
  YouTube再生        `youtube_player_flutter`                     ★★★★★
  YouTube情報取得    `youtube_explode_dart`                       ★★★★★
  一般動画再生       `flutter_vlc_player`                         ★★★★★
  Audio処理          `ffmpeg_kit_flutter_audio`                   ★★★★★
  Audio再生          `audioplayers`                               ★★★★☆
  Background Audio   `audio_service`                              ★★★★☆
  Audio Session      `audio_session`                              ★★★★☆
  Player Progress    `audio_video_progress_bar`                   ★★★★★
  録音               `record`                                     ★★★★★
  言語判定           `google_mlkit_language_id`                   ★★★★★
  日本語処理         `kana_kit`                                   ★★★★☆
  API通信            `dio` / `http`                               ★★★★★
  Cloud DB           `cloud_firestore`                            ★★★★★
  Local DB           `hive` / `sqflite`                           ★★★★★
  簡易Local保存      `shared_preferences`                         ★★★☆☆
  Secure Storage     `flutter_secure_storage`                     ★★★★★
  Cloud File         `firebase_storage`                           ★★★★☆
  Auth               `firebase_auth`                              ★★★★★
  Google Login       `google_sign_in`                             ★★★★☆
  Analytics          `firebase_analytics`                         ★★★★☆
  Crash監視          `firebase_crashlytics`                       ★★★★☆
  Push通知           `firebase_messaging`                         ★★★★☆
  Remote設定         `firebase_remote_config`                     ★★★☆☆
  JSON               `json_serializable`                          ★★★★☆
  多言語UI           `intl` / `i18n`                              ★★★★★
  課金               `purchases_flutter` / `in_app_purchase`      ★★★★★

------------------------------------------------------------------------

# Miraaの推定技術アーキテクチャ

> 注意：以下は謝辞に掲載されたPackageから読み取れる**技術的に可能な構成の推定**であり、Miraaの非公開Source
> CodeやServer Architectureを確認したものではない。

``` text
                    ┌─────────────────────┐
                    │    Flutter App      │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          ▼                   ▼                    ▼
     Account/Auth          Video/Audio          Learning UI
          │                   │                    │
  Firebase Auth       YouTube Player        Parsed Text
  Google Sign-In      YouTube Explode       Grouped List
          │            VLC Player            Progress Bar
          │                   │
          │                   ▼
          │               FFmpeg Kit
          │                   │
          │             Audio Processing
          │                   │
          │                   ▼
          │             Server / AI API
          │                   │
          │              Transcription
          │              Translation
          │              AI Analysis
          │
          ├───────────────────┐
          ▼                   ▼
     Cloud Firestore     Firebase Storage
          │
          ▼
       User Data
       Progress
       History
       Saved Words
```

## AI文字起こし部分について

今回の最終画像で`ffmpeg_kit_flutter_audio`が明確に確認できたことで、MiraaのMedia
Processing能力について重要な材料が増えた。

技術的には、

``` text
YouTube / 動画ファイル
        ↓
Media Stream / File取得
        ↓
FFmpeg
        ↓
Audio抽出・変換
        ↓
ServerへUpload
        ↓
Speech-to-Text
        ↓
Timestamp付き字幕
        ↓
Flutter Appへ返却
        ↓
動画と字幕を同期
```

というPipelineを構築できるPackage構成になっている。

ただし、**Packageが入っていること自体は、そのPipelineをMiraaが必ずその通り実装している証拠ではない。**

------------------------------------------------------------------------

# 自分たちのアプリに必要な構成へ整理

MiraaのPackageを全部そのまま真似する必要はない。

現在考えているアプリのMVPなら、むしろ以下程度から始める方が現実的。

``` text
Flutter
│
├── Firebase
│   ├── Auth
│   ├── Firestore
│   ├── Analytics
│   └── Crashlytics
│
├── Video
│   ├── YouTube Player
│   └── Subtitle Engine
│
├── AI Backend
│   ├── Speech-to-Text
│   ├── Translation
│   ├── Level Estimation
│   ├── i+1 Phrase Selection
│   └── Exercise Generation
│
├── Learning Engine
│   ├── User Level
│   ├── Comprehension %
│   ├── Known Words
│   ├── Saved Phrases
│   └── Spaced Repetition
│
└── Local Storage
    ├── Learning State
    └── Cache
```

## Miraaから参考にする部分

``` text
動画を扱う技術
字幕同期
Media Processing
言語判定
Player UI
ローカル保存
Cloud同期
認証
課金
Analytics
```

## 自分たちのアプリで独自に作る部分

``` text
英語レベル診断
        ↓
目標設定
        ↓
テーマ選択
        ↓
レベル × テーマで動画推薦
        ↓
「この動画を何％理解できそうか」
        ↓
動画インプット
        ↓
既知語を隠して認知負荷を調整
        ↓
i+1フレーズ抽出
        ↓
穴埋め → Recall → Speaking
        ↓
分散学習
        ↓
次の動画へ
```

つまり、Miraaの技術調査から得られる一番大きなポイントは、**動画学習の土台そのものは既存のFlutter技術を組み合わせてかなりの部分まで構築できる**ということ。

一方で、このアプリの本当の差別化になりそうな

**「ユーザーのレベルを理解する → 理解可能な動画を選ぶ →
i+1だけを学ばせる → アウトプットさせる → 忘れる頃に復習させる」**

というLearning
Engineは、MiraaのPackage一覧をコピーして作れるものではなく、こちら側で設計する中核ロジックになる。
