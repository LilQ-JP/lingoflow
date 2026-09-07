import "./style.css";
import { setupLearningUI, wordMarkup } from "./learning-ui.ts";
import { setupSpeakingPractice } from "./speaking-practice.ts";
import { setupClozeQuiz } from "./cloze-quiz.ts";
import { captions, VIDEO_ID } from "./captions.ts";
import { activeCaption, phraseTarget, clampTime, SeekGuard } from "./sync.ts";
import { loadYouTube, type Player } from "./youtube.ts";

const icons = {
  back: '<svg viewBox="0 0 24 24"><path d="m15 4-8 8 8 8"/></svg>',
  captions:
    '<svg viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5Z"/><path d="M8 9h8M8 12h5"/></svg>',
  focus:
    '<svg viewBox="0 0 24 24"><path d="M8 3H4a1 1 0 0 0-1 1v4M16 3h4a1 1 0 0 1 1 1v4M21 16v4a1 1 0 0 1-1 1h-4M8 21H4a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="3"/></svg>',
  previous: '<svg viewBox="0 0 24 24"><path d="M6 5v14M19 6l-9 6 9 6Z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M18 5v14M5 6l9 6-9 6Z"/></svg>',
  repeat:
    '<svg viewBox="0 0 24 24"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m8 4 12 8-12 8Z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  explain:
    '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3Z"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',
  replay:
    '<svg viewBox="0 0 24 24"><path d="M4 10a8 8 0 1 1 1.3 6.4"/><path d="M4 4v6h6"/></svg>',
  microphone:
    '<svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  volume:
    '<svg viewBox="0 0 24 24"><path d="M5 10v4h4l5 4V6l-5 4Z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>',
  userAudio:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></svg>',
  retry:
    '<svg viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></svg>',
  quiz: '<svg viewBox="0 0 24 24"><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 12h3M15 16l1.5 1.5L20 14"/></svg>',
};

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<main class="phone-app">
  <header class="app-header">
    <button id="go-back" class="icon-button" aria-label="戻る">${icons.back}</button>
    <h1>Me at the zoo</h1>
    <button id="quiz-action" class="quiz-launch requires-player" disabled aria-label="穴埋めクイズを始める">${icons.quiz}<span>Quiz</span></button>
    <button id="translate-toggle" class="language-toggle" aria-pressed="true" aria-label="日本語訳を表示中">JA <span>/</span> EN</button>
  </header>
  <div class="video-shell"><div id="youtube-player"></div></div>
  <nav class="view-switch" role="tablist" aria-label="字幕の表示方法">
    <button id="tab-focus" role="tab" aria-selected="false" aria-controls="panel-focus" tabindex="-1">${icons.focus}<span>集中表示</span></button>
    <button id="tab-transcript" role="tab" aria-selected="true" aria-controls="panel-transcript">${icons.captions}<span>字幕リスト</span></button>
  </nav>
  <div class="content-area">
    <section id="panel-focus" class="focus-panel" role="tabpanel" aria-labelledby="tab-focus" hidden>
      <p id="current-en" class="current-en"></p>
      <p id="current-ja" class="current-ja"></p>
      <div class="focus-actions">
        <button id="focus-replay" class="mini-action requires-player">${icons.replay}<span>0.7s Replay</span></button>
        <button id="focus-explain" class="mini-action requires-player">${icons.explain}<span>AI Explain</span></button>
        <button id="focus-save" class="mini-action" aria-pressed="false">${icons.save}<span>Save</span></button>
      </div>
    </section>
    <section id="panel-transcript" role="tabpanel" aria-labelledby="tab-transcript">
      <button id="follow" class="follow" hidden>現在の字幕へ</button>
      <div id="caption-list" class="caption-list" tabindex="0" aria-label="字幕一覧"></div>
    </section>
  </div>
  <footer class="control-deck">
    <div class="timeline">
      <input id="timeline" aria-label="再生位置" type="range" min="0" max="19000" step="10" value="0" disabled>
      <output id="elapsed">00:00</output><span>/</span><output id="duration">00:19</output>
    </div>
    <div class="transport">
      <button id="prev-phrase" class="deck-control requires-player" disabled aria-label="前のフレーズ">${icons.previous}<span>前</span></button>
      <button id="repeat" class="deck-control requires-player" aria-pressed="false" disabled aria-label="1文リピート">${icons.repeat}<span id="repeat-state">リピート</span></button>
      <button id="play" class="play-button requires-player" aria-label="再生" disabled>${icons.play}</button>
      <button id="next-phrase" class="deck-control requires-player" disabled aria-label="次のフレーズ">${icons.next}<span>次</span></button>
      <button id="speed" class="deck-control requires-player" disabled aria-label="再生速度"><strong id="speed-value">1.0x</strong><span>速度</span></button>
    </div>
    <button id="speak-action" class="practice-button requires-player" disabled>${icons.microphone}<span>Practice Speaking</span></button>
    <p id="status" role="status">YouTubeに接続しています…</p><div id="error" role="alert" hidden></div>
  </footer>
  <dialog id="word-sheet" aria-labelledby="word-title"><div class="sheet-handle" aria-hidden="true"></div><button id="close-word" class="icon-button close-word" aria-label="解説を閉じる"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button><h2 id="word-title"></h2><div class="phonetic-row"><span id="word-phonetic"></span><button id="speak-small" aria-label="発音を聞く" class="sound-icon"><svg viewBox="0 0 24 24"><path d="M5 10v4h4l5 4V6l-5 4Z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg></button></div><span id="word-pos" class="pos"></span><p id="word-meaning" class="meaning"></p><div class="word-example"><h3>この動画では</h3><p id="word-example"></p><p id="word-translation"></p></div><div class="word-example usage"><h3>使い方のポイント</h3><p id="word-usage"></p></div><p class="dictionary-note">技術スパイク用のサンプル解説</p><button id="save-word" class="outline-button"></button><button id="speak-word" class="indigo-button"><svg viewBox="0 0 24 24"><path d="M5 10v4h4l5 4V6l-5 4Z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg><span>発音を聞く</span></button><p id="speech-state" role="status"></p></dialog>
  <dialog id="practice-sheet" class="practice-sheet" aria-labelledby="practice-title">
    <div class="sheet-handle" aria-hidden="true"></div>
    <button id="close-practice" class="icon-button close-practice" aria-label="発話練習を閉じる">${icons.close}</button>
    <div class="practice-heading"><span>Speaking Practice</span><strong>即時採点</strong></div>
    <h2 id="practice-title"></h2>
    <p id="practice-translation" class="practice-translation"></p>
    <div class="model-audio" aria-label="お手本音声">
      <button id="model-normal" class="audio-button">${icons.volume}<span>お手本を聞く</span><strong>1.0x</strong></button>
      <button id="model-slow" class="audio-button">${icons.volume}<span>ゆっくり</span><strong>0.8x</strong></button>
    </div>
    <div class="microphone-stage">
      <button id="practice-mic" class="practice-mic" aria-label="録音を開始" aria-pressed="false">${icons.microphone}</button>
      <p id="practice-prompt">マイクを押して話してください</p>
      <p id="live-transcript" class="live-transcript" aria-live="polite"></p>
    </div>
    <div id="practice-result" class="practice-result" hidden>
      <div class="result-summary"><span id="result-badge"></span><strong id="result-score"></strong></div>
      <p id="scored-words" class="scored-words"></p>
      <p class="recognized-label">認識した音声</p>
      <p id="recognized-text" class="recognized-text"></p>
      <div class="feedback-grid"><div><span>良かった点</span><p id="positive-feedback"></p></div><div><span>改善ポイント</span><p id="improvement-feedback"></p></div></div>
    </div>
    <p id="practice-error" class="practice-error" role="alert" hidden></p>
    <div class="practice-actions">
      <button id="play-recording" class="secondary-3d" disabled>${icons.userAudio}<span>自分の声を聞く</span></button>
      <button id="retry-practice" class="primary-3d" disabled>${icons.retry}<span>もう一度チャレンジ</span></button>
    </div>
  </dialog>
  <dialog id="quiz-sheet" class="quiz-sheet" aria-labelledby="quiz-title"></dialog>
</main>
<div id="toast" role="status" class="toast" hidden></div>
<details class="diagnostics"><summary>開発・表示設定</summary><label>表示テーマ <select id="theme"><option value="dark">ダーク</option><option value="light">ライト</option><option value="system">システム</option></select></label><p>手動の抜粋字幕を約50ms間隔で同期。字幕のない区間があります。</p><div class="metrics"><span>再生時刻(ms) <output id="clock">0</output></span><span>状態 <output id="state">loading</output></span><span>現在字幕 <output id="active">none</output></span><span>シーク要求 <output id="seek-target">—</output></span></div><pre id="events" aria-label="同期イベント履歴"></pre><div class="extra-controls"><button id="back" disabled>−5秒</button><button id="forward" disabled>＋5秒</button><button id="replay" disabled>フレーズを再生</button></div></details>`;

document.documentElement.dataset.theme = "dark";
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
function format(ms: number) {
  return `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
}
function formatRate(rate: number) {
  return `${Number.isInteger(rate) ? rate.toFixed(1) : rate}x`;
}

const slider = el<HTMLInputElement>("timeline");
const list = el("caption-list");
const guard = new SeekGuard();
const events: string[] = [];
let player: Player | undefined;
let ready = false,
  failed = false,
  scrubbing = false,
  translate = true,
  following = true;
let timeMs = 0,
  durationMs = 19000,
  state = -1,
  raf = 0,
  lastPoll = 0;
let activeId: string | undefined,
  shownCaption = captions[0];
let lastTapped: (typeof captions)[number] | undefined;
let prerollCaption: (typeof captions)[number] | undefined;
let repeatCaption: (typeof captions)[number] | undefined;
let lastActual = 0,
  lastActualAt = 0;
const learning = setupLearningUI(() => player?.pauseVideo());
const speaking = setupSpeakingPractice(() => player?.pauseVideo());
let quizAudioTimer = 0;
const quiz = setupClozeQuiz({
  pauseVideo: () => {
    clearTimeout(quizAudioTimer);
    player?.pauseVideo();
  },
  playPhrase: (caption) => {
    clearTimeout(quizAudioTimer);
    replayPhrase(caption);
    quizAudioTimer = window.setTimeout(
      () => player?.pauseVideo(),
      caption.endMs - phraseTarget(caption.startMs) + 180,
    );
  },
});

function record(message: string) {
  events.unshift(message);
  events.length = Math.min(events.length, 24);
  el("events").textContent = events.join("\n");
}
function currentForAction() {
  return (
    (prerollCaption && timeMs < prerollCaption.startMs
      ? prerollCaption
      : undefined) ??
    activeCaption(captions, timeMs) ??
    lastTapped ??
    shownCaption
  );
}
function paintSaveStates() {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    ".save-phrase",
  )) {
    button.setAttribute(
      "aria-pressed",
      String(learning.isPhraseSaved(button.dataset.phrase!)),
    );
  }
  el("focus-save").setAttribute(
    "aria-pressed",
    String(learning.isPhraseSaved(shownCaption.id)),
  );
}
function paintCaption(caption: (typeof captions)[number]) {
  shownCaption = caption;
  el("current-en").innerHTML = wordMarkup(caption.text);
  el("current-ja").textContent = caption.translation;
  learning.setActivePhrase(caption);
  paintSaveStates();
}
function replayPhrase(caption: (typeof captions)[number], keepRepeat = false) {
  lastTapped = caption;
  prerollCaption = caption;
  paintCaption(caption);
  seek(phraseTarget(caption.startMs), true, keepRepeat);
}
function explainPhrase(
  caption: (typeof captions)[number],
  opener: HTMLElement,
) {
  paintCaption(caption);
  learning.openExplanation(caption, opener);
}
function savePhrase(caption: (typeof captions)[number]) {
  paintCaption(caption);
  learning.togglePhrase(caption);
  paintSaveStates();
}

for (const caption of captions) {
  const row = document.createElement("article");
  row.id = caption.id;
  row.className = "caption-row";
  row.innerHTML = `
    <button class="caption-time requires-player" disabled aria-label="${format(caption.startMs)}から再生">${format(caption.startMs)}</button>
    <div class="caption-copy"><p class="caption-en">${wordMarkup(caption.text)}</p><p class="caption-ja">${caption.translation}</p></div>
    <div class="row-actions">
      <button class="row-action requires-player" data-action="replay" disabled aria-label="0.7秒前から再生">${icons.replay}<span>0.7s</span></button>
      <button class="row-action requires-player" data-action="explain" disabled>${icons.explain}<span>AI Explain</span></button>
      <button class="row-action save-phrase" data-action="save" data-phrase="${caption.id}" aria-pressed="false">${icons.save}<span>Save</span></button>
    </div>`;
  row.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const word = target.closest<HTMLButtonElement>("[data-word]");
    if (word) return learning.openWord(word.dataset.word!, word);
    const action = target.closest<HTMLButtonElement>("[data-action]");
    if (action?.dataset.action === "replay") return replayPhrase(caption);
    if (action?.dataset.action === "explain")
      return explainPhrase(caption, action);
    if (action?.dataset.action === "save") return void savePhrase(caption);
    replayPhrase(caption, !!repeatCaption);
    if (repeatCaption) {
      repeatCaption = caption;
      updateRepeat();
    }
  });
  list.append(row);
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
  el("repeat-state").textContent = on ? "ON" : "リピート";
}
function scrollActive() {
  if (!activeId || !following) return;
  const row = el(activeId);
  list.scrollTo({
    top: Math.max(
      0,
      row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2,
    ),
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
function render(actualMs: number, hideCaption = false) {
  timeMs = actualMs;
  el("clock").textContent = String(Math.round(actualMs));
  el("elapsed").textContent = format(actualMs);
  if (!scrubbing) slider.value = String(actualMs);
  const natural = hideCaption ? undefined : activeCaption(captions, actualMs);
  const caption =
    !hideCaption && prerollCaption && actualMs < prerollCaption.startMs
      ? prerollCaption
      : natural;
  if (prerollCaption && actualMs >= prerollCaption.startMs)
    prerollCaption = undefined;
  el<HTMLButtonElement>("replay").disabled = !ready || !caption || hideCaption;
  if (activeId !== caption?.id) {
    activeId = caption?.id;
    for (const item of captions) {
      const row = el(item.id);
      row.classList.toggle("active", item.id === activeId);
      if (item.id === activeId) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    }
    if (caption) paintCaption(caption);
    record(`${Math.round(actualMs)} ms · caption=${activeId ?? "none"}`);
    scrollActive();
  }
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
  if (repeatCaption) repeatCaption = target;
  replayPhrase(target, !!repeatCaption);
  updateRepeat();
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
  el("play").innerHTML = next === 1 ? icons.pause : icons.play;
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
      ".requires-player, .extra-controls button",
    )
    .forEach((button) => (button.disabled = true));
  slider.disabled = true;
}
function setView(view: "focus" | "transcript") {
  for (const name of ["focus", "transcript"] as const) {
    const selected = name === view;
    el(`tab-${name}`).setAttribute("aria-selected", String(selected));
    el(`tab-${name}`).tabIndex = selected ? 0 : -1;
    el(`panel-${name}`).hidden = !selected;
  }
  if (view === "transcript") scrollActive();
}

el("tab-focus").onclick = () => setView("focus");
el("tab-transcript").onclick = () => setView("transcript");
el("prev-phrase").onclick = () => goToPhrase(-1);
el("next-phrase").onclick = () => goToPhrase(1);
el("repeat").onclick = () => {
  if (repeatCaption) repeatCaption = undefined;
  else {
    repeatCaption = currentForAction();
    replayPhrase(repeatCaption, true);
  }
  updateRepeat();
};
el("play").onclick = () =>
  state === 1 ? player?.pauseVideo() : player?.playVideo();
el("speed").onclick = () => {
  if (!player || !ready) return;
  const rates = player.getAvailablePlaybackRates();
  const current = rates.indexOf(player.getPlaybackRate());
  const next = rates[(current + 1) % rates.length] ?? 1;
  player.setPlaybackRate(next);
};
el("speak-action").onclick = () => {
  speaking.open(currentForAction(), el("speak-action"));
};
el("quiz-action").onclick = () => quiz.open(el("quiz-action"));
el("focus-replay").onclick = () => replayPhrase(currentForAction());
el("focus-explain").onclick = () =>
  explainPhrase(currentForAction(), el("focus-explain"));
el("focus-save").onclick = () => savePhrase(currentForAction());
el("back").onclick = () => seek(timeMs - 5000, false);
el("forward").onclick = () => seek(timeMs + 5000, false);
el("replay").onclick = () => replayPhrase(currentForAction());
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
  list.classList.toggle("translations-off", !translate);
};
const pauseFollow = () => {
  following = false;
  el("follow").hidden = false;
};
list.addEventListener("wheel", pauseFollow, { passive: true });
list.addEventListener("touchmove", pauseFollow, { passive: true });
el("follow").onclick = () => {
  following = true;
  el("follow").hidden = true;
  scrollActive();
};
el("go-back").onclick = () => {
  player?.pauseVideo();
  learning.toast("技術スパイクのため、前の画面はまだありません");
};
el<HTMLSelectElement>("theme").onchange = (event) => {
  document.documentElement.dataset.theme = (
    event.target as HTMLSelectElement
  ).value;
};
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(raf);
  speaking.destroy();
  quiz.destroy();
});
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
              ".requires-player, .extra-controls button",
            )
            .forEach((button) => (button.disabled = false));
          slider.disabled = false;
          setStatus(5);
          prerollCaption = captions[0];
          render(0);
          raf = requestAnimationFrame(poll);
          document
            .querySelector("iframe")
            ?.setAttribute("title", "YouTube: Me at the zoo");
        },
        onStateChange: (event) => setStatus(event.data),
        onPlaybackRateChange: () => {
          el("speed-value").textContent = formatRate(
            player?.getPlaybackRate() ?? 1,
          );
        },
        onError: (event) => {
          clearTimeout(readyTimeout);
          fail(`YouTube再生エラー（${event.data}）です。`);
        },
        onAutoplayBlocked: () => {
          el("status").textContent = "再生ボタンを押してください";
        },
      },
    });
  })
  .catch((error) =>
    fail(error instanceof Error ? error.message : "読み込みに失敗しました。"),
  );
