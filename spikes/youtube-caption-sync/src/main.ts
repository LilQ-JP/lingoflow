import "./style.css";
import { captions, VIDEO_ID } from "./captions.ts";
import { activeCaption, phraseTarget, clampTime, SeekGuard } from "./sync.ts";
import { loadYouTube, type Player } from "./youtube.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header class="site-header"><a class="wordmark" href="/" aria-label="Lingoflow ホーム"><span class="brand-dot"></span>Lingo<span>flow</span></a><span class="header-label">動画で学ぶ</span><span class="pill">EN → 日本語</span><select id="theme" aria-label="表示テーマ"><option value="system">システム</option><option value="light">ライト</option><option value="dark">ダーク</option></select></header>
<main><div class="intro"><div><p class="eyebrow">LISTEN. NOTICE. REPLAY.</p><h1>聞き取れた、を増やそう。</h1><p class="muted">気になったフレーズをタップ。何度でも、その場面へ。</p></div><span class="lesson-tag">01 <span>Listening session</span></span></div>
<section class="lesson" aria-label="動画レッスン"><div class="video-column"><div class="video-shell"><div id="youtube-player"></div></div>
<div class="video-meta"><div><h2>Me at the zoo</h2><a href="https://www.youtube.com/watch?v=jNQXAC9IVRw" target="_blank" rel="noreferrer">jawed · YouTube ↗</a></div><span class="pill">日常 / 動物</span></div>
<div class="current-caption"><p class="eyebrow">NOW LISTENING <span id="current-index">—</span></p><p id="current-en">再生して、フレーズを聞いてみよう。</p><p id="current-ja" class="muted"></p></div>
<div class="controls"><div class="timeline"><output id="elapsed">0:00</output><input id="timeline" aria-label="再生位置" type="range" min="0" max="19000" step="10" value="0" disabled><output id="duration">0:19</output></div><div class="transport"><button id="back" disabled>−5秒</button><button id="play" class="primary" disabled>▶ 再生</button><button id="forward" disabled>＋5秒</button></div><button id="replay" class="replay" disabled>↶ このフレーズをもう一度</button></div>
<p id="status" role="status">YouTubeに接続しています…</p><div id="error" role="alert" hidden></div>
</div><section class="transcript-panel" aria-label="字幕一覧"><div class="transcript-heading"><div><p class="eyebrow">TRANSCRIPT</p><h2>フレーズを聞く</h2></div><label class="translation-toggle"><input id="translate" type="checkbox" checked>日本語</label></div><p class="muted small">タップすると、発話の0.7秒前から再生</p><button id="follow" class="follow" hidden>現在位置へ戻る ↓</button><div id="caption-list" class="caption-list" tabindex="0" aria-label="フレーズ一覧"></div><p class="fixture-note">同期検証用の短い抜粋字幕です。抜粋のない区間は字幕を表示しません。</p></section></section>
<details class="diagnostics"><summary>同期の検証情報</summary><p>実プレイヤーから約50ms間隔で時刻を取得。数値の単位はmsです。YouTube側の更新・シーク精度と字幕の手動時刻には誤差があります。</p><div class="metrics"><span>再生時刻 <output id="clock">0</output></span><span>状態 <output id="state">loading</output></span><span>現在字幕 <output id="active">none</output></span><span>最終シーク要求 <output id="seek-target">—</output></span></div><pre id="events" aria-label="同期イベント履歴"></pre></details>
<footer>LINGOFLOW <span>好きな動画が、あなたの教材に。</span></footer></main>`;
function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
const slider = el<HTMLInputElement>("timeline");
const list = el("caption-list");
const guard = new SeekGuard();
let player: Player | undefined;
let ready = false,
  timeMs = 0,
  durationMs = 19000,
  state = -1,
  scrubbing = false,
  following = true;
let activeId: string | undefined,
  translate = true,
  raf = 0,
  lastPoll = 0,
  failed = false;
const events: string[] = [];
function record(message: string) {
  events.unshift(message);
  events.length = Math.min(events.length, 24);
  el("events").textContent = events.slice(0, 24).join("\n");
}
function format(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
}
for (const c of captions) {
  const button = document.createElement("button");
  button.className = "caption";
  button.id = c.id;
  button.disabled = true;
  button.innerHTML = `<span class="caption-time">${format(c.startMs)}</span><span class="caption-copy"><span class="en">${c.text}</span><span class="ja">${c.translation}</span></span><span class="caption-arrow" aria-hidden="true">↶</span>`;
  button.addEventListener("click", () => seek(phraseTarget(c.startMs), true));
  list.append(button);
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
  const c = hideCaption ? undefined : activeCaption(captions, actualMs);
  el<HTMLButtonElement>("replay").disabled = !ready || !c || hideCaption;
  if (activeId !== c?.id) {
    activeId = c?.id;
    for (const item of captions) {
      const row = el(item.id);
      row.classList.toggle("active", item.id === activeId);
      if (item.id === activeId) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    }
    record(`${Math.round(actualMs)} ms · caption=${activeId ?? "none"}`);
    scrollActive();
  }
  el("active").textContent = activeId ?? "none";
  el("current-index").textContent = c
    ? `${captions.indexOf(c) + 1} / ${captions.length}`
    : "—";
  el("current-en").textContent =
    c?.text ??
    (hideCaption ? "再生位置を移動しています…" : "この区間の字幕はありません");
  el("current-ja").textContent = translate ? (c?.translation ?? "") : "";
}
function seek(ms: number, autoplay: boolean) {
  if (!ready || !player) return;
  const target = clampTime(ms, durationMs);
  guard.request(target, performance.now());
  el("seek-target").textContent = String(Math.round(target));
  record(`seek → ${Math.round(target)} ms${autoplay ? " / play" : ""}`);
  render(target, true);
  player.seekTo(target / 1000, true);
  if (autoplay) player.playVideo();
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
  el("play").textContent = next === 1 ? "Ⅱ 一時停止" : "▶ 再生";
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
    .querySelectorAll<HTMLButtonElement>(".controls button, .caption")
    .forEach((b) => (b.disabled = true));
  slider.disabled = true;
}
el("play").onclick = () => {
  if (state === 1) player?.pauseVideo();
  else player?.playVideo();
};
el("back").onclick = () => seek(timeMs - 5000, false);
el("forward").onclick = () => seek(timeMs + 5000, false);
el("replay").onclick = () => {
  const c = activeCaption(captions, timeMs);
  if (c) seek(phraseTarget(c.startMs), true);
};
slider.oninput = () => {
  scrubbing = true;
  render(Number(slider.value));
};
slider.onchange = () => {
  scrubbing = false;
  seek(Number(slider.value), false);
};
slider.addEventListener("pointercancel", () => {
  scrubbing = false;
});
el<HTMLInputElement>("translate").onchange = (e) => {
  translate = (e.target as HTMLInputElement).checked;
  list.classList.toggle("hide-translation", !translate);
  render(timeMs, !!guard.pending);
};
function pauseFollow() {
  following = false;
  el("follow").hidden = false;
}
list.addEventListener("wheel", pauseFollow, { passive: true });
list.addEventListener("touchmove", pauseFollow, { passive: true });
list.addEventListener("keydown", (e) => {
  if (
    ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(
      e.key,
    )
  )
    pauseFollow();
});
el("follow").onclick = () => {
  following = true;
  el("follow").hidden = true;
  scrollActive();
};
el<HTMLSelectElement>("theme").onchange = (e) => {
  document.documentElement.dataset.theme = (
    e.target as HTMLSelectElement
  ).value;
};
window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
window.addEventListener("pageshow", (e) => {
  if (e.persisted && ready) raf = requestAnimationFrame(poll);
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
            .querySelectorAll<HTMLButtonElement>(".controls button, .caption")
            .forEach((b) => (b.disabled = false));
          slider.disabled = false;
          setStatus(5);
          render(0);
          raf = requestAnimationFrame(poll);
          document
            .querySelector("iframe")
            ?.setAttribute("title", "YouTube: Me at the zoo");
        },
        onStateChange: (e) => setStatus(e.data),
        onError: (e) => {
          clearTimeout(readyTimeout);
          fail(`YouTube再生エラー（${e.data}）です。`);
        },
        onAutoplayBlocked: () => {
          el("status").textContent =
            "再生ボタンを押してください（ブラウザが自動再生を制限しています）。";
        },
      },
    });
  })
  .catch((error) =>
    fail(error instanceof Error ? error.message : "読み込みに失敗しました。"),
  );
