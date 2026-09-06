import "./style.css";
import { setupLearningUI, wordMarkup } from "./learning-ui.ts";
import { captions, VIDEO_ID } from "./captions.ts";
import { activeCaption, phraseTarget, clampTime, SeekGuard } from "./sync.ts";
import { loadYouTube, type Player } from "./youtube.ts";

const droplet = `<svg class="droplet" viewBox="0 0 48 56" aria-hidden="true"><defs><linearGradient id="drop" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#65e8ff"/><stop offset=".55" stop-color="#4788ff"/><stop offset="1" stop-color="#6f3bff"/></linearGradient></defs><path fill="url(#drop)" d="M24 1S5 23 5 36a19 19 0 0 0 38 0C43 23 24 1 24 1Z"/><path stroke="#162a5c" stroke-width="4" stroke-linecap="round" d="M7 31c-5 2-5 13 0 16M41 31c5 2 5 13 0 16"/><rect x="2" y="33" width="7" height="13" rx="3.5" fill="#8cecff"/><rect x="39" y="33" width="7" height="13" rx="3.5" fill="#8cecff"/><circle cx="18" cy="35" r="2" fill="#102653"/><circle cx="30" cy="35" r="2" fill="#102653"/><path d="M19 42c3 3 7 3 10 0" stroke="#102653" stroke-width="2" stroke-linecap="round"/></svg>`;
const playIcon = '<svg viewBox="0 0 24 24"><path d="m8 4 12 8-12 8z"/></svg>';
const pauseIcon =
  '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<main class="phone-app">
  <header class="app-header">
    <button id="go-back" class="icon-button" aria-label="戻る"><svg viewBox="0 0 24 24"><path d="m15 4-8 8 8 8"/></svg></button>
    <div class="title-lockup">${droplet}<h1>Me at the zoo</h1></div>
    <button id="translate-toggle" class="language-toggle" aria-pressed="true" aria-label="日本語訳を表示中">JA <span>/</span> EN</button>
    <button id="settings" class="icon-button settings" aria-label="表示設定"><svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m4.9 4.9 2 1.1 2.2-1.3L9.3 2h5.4l.2 2.7L17.1 6l2-1.1 2.7 4.7-2.2 1.5v2.6l2.2 1.5-2.7 4.7-2-1.1-2.2 1.3-.2 2.7H9.3l-.2-2.7-2.2-1.3-2 1.1-2.7-4.7 2.2-1.5v-2.6L2.2 9.6Z"/></svg></button>
  </header>
  <div class="video-shell">
    <div id="youtube-player"></div>
    <div class="video-overlay" aria-label="フレーズ移動">
      <button id="prev-phrase" class="frost-pill" disabled><strong>⏮</strong><span>前のセリフ</span></button>
      <button id="next-phrase" class="frost-pill" disabled><strong>⏭</strong><span>次のセリフ</span></button>
      <span class="preroll-note">↻ 0.7s preroll</span>
    </div>
  </div>
  <section class="lesson-card" aria-live="polite">
    <div class="lesson-meta"><span>📖 今日のレッスン</span><strong>A1-B1</strong></div>
    <p id="current-en" class="current-en"></p>
    <p id="current-ja" class="current-ja"></p>
    <div class="coach"><span>Nice! Keep going!</span>${droplet}</div>
  </section>
  <div class="timeline">
    <input id="timeline" aria-label="再生位置" type="range" min="0" max="19000" step="10" value="0" disabled>
    <output id="elapsed">00:00</output><span>/</span><output id="duration">00:19</output>
  </div>
  <footer class="action-bar">
    <button id="ai-explain" class="action-button purple" disabled><span class="action-icon">📖</span><span>AI解説</span></button>
    <button id="repeat" class="action-button blue" aria-pressed="false" disabled><span class="action-icon">🔁</span><span id="repeat-state">1文リピート</span></button>
    <button id="save-action" class="action-button amber" aria-pressed="false"><span class="action-icon">★</span><span id="save-state">保存</span></button>
    <button id="speak-action" class="action-button green" disabled><span class="action-icon">🎙</span><span>声に出す</span></button>
  </footer>
  <p id="status" role="status">YouTubeに接続しています…</p><div id="error" role="alert" hidden></div>
  <button id="play" hidden aria-label="再生" disabled></button>
  <dialog id="word-sheet" aria-labelledby="word-title"><div class="sheet-handle" aria-hidden="true"></div><button id="close-word" class="icon-button close-word" aria-label="解説を閉じる"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button><h2 id="word-title"></h2><div class="phonetic-row"><span id="word-phonetic"></span><button id="speak-small" aria-label="発音を聞く" class="sound-icon">♪</button></div><span id="word-pos" class="pos"></span><p id="word-meaning" class="meaning"></p><div class="word-example"><h3>この動画では</h3><p id="word-example"></p><p id="word-translation"></p></div><div class="word-example usage"><h3>使い方のポイント</h3><p id="word-usage"></p></div><p class="dictionary-note">技術スパイク用のサンプル解説</p><button id="save-word" class="outline-button"></button><button id="speak-word" class="indigo-button">発音を聞く</button><p id="speech-state" role="status"></p></dialog>
</main>
<div id="toast" role="status" class="toast" hidden></div>
<details class="diagnostics"><summary>開発・表示設定</summary><label>表示テーマ <select id="theme"><option value="dark">ダーク</option><option value="light">ライト</option><option value="system">システム</option></select></label><p>手動の抜粋字幕を約50ms間隔で同期。字幕のない区間があります。</p><div class="metrics"><span>再生時刻(ms) <output id="clock">0</output></span><span>状態 <output id="state">loading</output></span><span>現在字幕 <output id="active">none</output></span><span>シーク要求 <output id="seek-target">—</output></span></div><pre id="events" aria-label="同期イベント履歴"></pre><div class="extra-controls"><button id="back" disabled>−5秒</button><button id="forward" disabled>＋5秒</button><button id="replay" disabled>フレーズを再生</button></div></details>`;

document.documentElement.dataset.theme = "dark";
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
const slider = el<HTMLInputElement>("timeline");
const guard = new SeekGuard();
let player: Player | undefined;
let ready = false,
  timeMs = 0,
  durationMs = 19000,
  state = -1,
  scrubbing = false;
let activeId: string | undefined,
  translate = true,
  raf = 0,
  lastPoll = 0,
  failed = false;
let shownCaption = captions[0],
  repeatCaption: (typeof captions)[number] | undefined;
let lastTapped: (typeof captions)[number] | undefined,
  prerollCaption: (typeof captions)[number] | undefined,
  lastActual = 0,
  lastActualAt = 0;
const events: string[] = [];
const learning = setupLearningUI(() => player?.pauseVideo());

function record(message: string) {
  events.unshift(message);
  events.length = Math.min(events.length, 24);
  el("events").textContent = events.join("\n");
}
function format(ms: number) {
  return `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
}
function currentForAction() {
  return (
    (prerollCaption && timeMs < prerollCaption.startMs
      ? prerollCaption
      : undefined) ??
    activeCaption(captions, timeMs) ??
    lastTapped ??
    shownCaption ??
    captions[0]
  );
}
function paintCaption(caption: (typeof captions)[number]) {
  shownCaption = caption;
  el("current-en").innerHTML = wordMarkup(caption.text);
  el("current-ja").textContent = caption.translation;
  el("current-ja").hidden = !translate;
  learning.setActivePhrase(caption);
}
el("current-en").addEventListener("click", (event) => {
  const word = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-word]",
  );
  if (word) learning.openWord(word.dataset.word!, word);
});
paintCaption(shownCaption);

function updateRepeat() {
  const on = !!repeatCaption;
  el("repeat").setAttribute("aria-pressed", String(on));
  el("repeat-state").textContent = on ? "リピート ON" : "1文リピート";
}
function render(actualMs: number, hideCaption = false) {
  timeMs = actualMs;
  el("clock").textContent = String(Math.round(actualMs));
  el("elapsed").textContent = format(actualMs);
  if (!scrubbing) slider.value = String(actualMs);
  const naturalCaption = hideCaption
    ? undefined
    : activeCaption(captions, actualMs);
  const caption =
    !hideCaption && prerollCaption && actualMs < prerollCaption.startMs
      ? prerollCaption
      : naturalCaption;
  if (prerollCaption && actualMs >= prerollCaption.startMs)
    prerollCaption = undefined;
  el<HTMLButtonElement>("replay").disabled = !ready || !caption || hideCaption;
  if (activeId !== caption?.id) {
    activeId = caption?.id;
    record(`${Math.round(actualMs)} ms · caption=${activeId ?? "none"}`);
  }
  if (caption) paintCaption(caption);
  el("active").textContent = activeId ?? "none";
}
function seek(ms: number, autoplay: boolean, keepRepeat = false) {
  if (!ready || !player) return;
  if (!keepRepeat) {
    repeatCaption = undefined;
    updateRepeat();
  }
  const target = clampTime(ms, durationMs);
  guard.request(target, performance.now());
  el("seek-target").textContent = String(Math.round(target));
  record(`seek → ${Math.round(target)} ms${autoplay ? " / play" : ""}`);
  render(target, true);
  player.seekTo(target / 1000, true);
  if (autoplay) player.playVideo();
}
function goToPhrase(direction: -1 | 1) {
  const current = currentForAction();
  const index = captions.indexOf(current);
  const target =
    captions[Math.max(0, Math.min(captions.length - 1, index + direction))];
  lastTapped = target;
  prerollCaption = target;
  paintCaption(target);
  if (repeatCaption) repeatCaption = target;
  updateRepeat();
  seek(phraseTarget(target.startMs), true, !!repeatCaption);
}
function setStatus(next: number) {
  state = next;
  const name =
    (
      {
        "-1": "未開始",
        "0": "終了",
        "1": "再生中",
        "2": "一時停止",
        "3": "読み込み中",
        "5": "再生準備完了",
      } as Record<string, string>
    )[next] ?? "待機中";
  el("status").textContent = name;
  el("state").textContent = `${next} / ${name}`;
  el("play").innerHTML = next === 1 ? pauseIcon : playIcon;
  el("play").setAttribute("aria-label", next === 1 ? "一時停止" : "再生");
  record(`state=${next}`);
}
function poll(now: number) {
  if (ready && player && !failed && now - lastPoll >= 50) {
    lastPoll = now;
    const ms = player.getCurrentTime() * 1000;
    const duration = player.getDuration() * 1000;
    if (duration > 0) {
      durationMs = duration;
      slider.max = String(durationMs);
      el("duration").textContent = format(durationMs);
    }
    if (!scrubbing && Number.isFinite(ms)) {
      const pending = guard.pending;
      const expectedAdvance = Math.max(
        900,
        (now - lastActualAt) * (player.getPlaybackRate() || 1) + 500,
      );
      if (
        !pending &&
        lastActualAt &&
        Math.abs(ms - lastActual) > expectedAdvance &&
        repeatCaption
      ) {
        repeatCaption = undefined;
        updateRepeat();
      }
      lastActual = ms;
      lastActualAt = now;
      if (
        !pending &&
        repeatCaption &&
        state === 1 &&
        ms >= repeatCaption.endMs
      ) {
        prerollCaption = repeatCaption;
        seek(phraseTarget(repeatCaption.startMs), true, true);
        raf = requestAnimationFrame(poll);
        return;
      }
      if (guard.accept(ms, now)) {
        if (pending)
          record(
            `seek settled: requested=${pending.targetMs}, actual=${Math.round(ms)}, delta=${Math.round(ms - pending.targetMs)} ms`,
          );
        render(ms);
      }
    }
  }
  raf = requestAnimationFrame(poll);
}
function fail(message: string) {
  failed = true;
  ready = false;
  el("error").hidden = false;
  el("error").textContent =
    `${message} 接続を確認し、ページを再読み込みしてください。`;
  el("status").textContent = "再生できません";
  document
    .querySelectorAll<HTMLButtonElement>(
      ".action-bar button, .video-overlay button, .extra-controls button",
    )
    .forEach((button) => (button.disabled = true));
  slider.disabled = true;
}

el("prev-phrase").onclick = () => goToPhrase(-1);
el("next-phrase").onclick = () => goToPhrase(1);
el("ai-explain").onclick = () =>
  learning.openExplanation(currentForAction(), el("ai-explain"));
el("repeat").onclick = () => {
  if (repeatCaption) repeatCaption = undefined;
  else {
    repeatCaption = currentForAction();
    lastTapped = repeatCaption;
    prerollCaption = repeatCaption;
    paintCaption(repeatCaption);
    seek(phraseTarget(repeatCaption.startMs), true, true);
  }
  updateRepeat();
};
el("speak-action").onclick = () => {
  player?.pauseVideo();
  learning.toast("表示中の一文を、動画と同じリズムで声に出してみよう");
};
el("play").onclick = () =>
  state === 1 ? player?.pauseVideo() : player?.playVideo();
el("back").onclick = () => seek(timeMs - 5000, false);
el("forward").onclick = () => seek(timeMs + 5000, false);
el("replay").onclick = () => {
  const caption = activeCaption(captions, timeMs);
  if (caption) seek(phraseTarget(caption.startMs), true);
};
slider.oninput = () => {
  scrubbing = true;
  render(Number(slider.value));
};
slider.onchange = () => {
  scrubbing = false;
  seek(Number(slider.value), false);
};
slider.addEventListener("pointercancel", () => (scrubbing = false));
el("translate-toggle").onclick = () => {
  translate = !translate;
  el("translate-toggle").setAttribute("aria-pressed", String(translate));
  el("translate-toggle").setAttribute(
    "aria-label",
    translate ? "日本語訳を表示中" : "日本語訳を非表示",
  );
  el("current-ja").hidden = !translate;
};
el("go-back").onclick = () => {
  player?.pauseVideo();
  learning.toast("技術スパイクのため、前の画面はまだありません");
};
el("settings").onclick = () => {
  const details = document.querySelector<HTMLDetailsElement>(".diagnostics")!;
  details.open = !details.open;
  details.scrollIntoView({ behavior: "smooth", block: "start" });
};
el<HTMLSelectElement>("theme").onchange = (event) => {
  document.documentElement.dataset.theme = (
    event.target as HTMLSelectElement
  ).value;
};
window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
window.addEventListener("pageshow", (event) => {
  if (event.persisted && ready) raf = requestAnimationFrame(poll);
});

loadYouTube()
  .then((YT) => {
    const readyTimeout = window.setTimeout(
      () => fail("プレイヤーの準備がタイムアウトしました。"),
      15000,
    );
    player = new YT.Player("youtube-player", {
      videoId: VIDEO_ID,
      width: "100%",
      height: "100%",
      playerVars: {
        origin: location.origin,
        playsinline: 1,
        controls: 1,
        fs: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          clearTimeout(readyTimeout);
          if (failed) return;
          ready = true;
          document
            .querySelectorAll<HTMLButtonElement>(
              ".action-bar button, .video-overlay button, .extra-controls button",
            )
            .forEach((button) => (button.disabled = false));
          slider.disabled = false;
          setStatus(5);
          render(0);
          raf = requestAnimationFrame(poll);
          document
            .querySelector("iframe")
            ?.setAttribute("title", "YouTube: Me at the zoo");
        },
        onStateChange: (event) => setStatus(event.data),
        onPlaybackRateChange: () => {
          record(`playback rate=${player?.getPlaybackRate() ?? 1}`);
        },
        onError: (event) => {
          clearTimeout(readyTimeout);
          fail(`YouTube再生エラー（${event.data}）です。`);
        },
        onAutoplayBlocked: () => {
          el("status").textContent = "YouTubeの再生ボタンを押してください";
        },
      },
    });
  })
  .catch((error) =>
    fail(error instanceof Error ? error.message : "読み込みに失敗しました。"),
  );
