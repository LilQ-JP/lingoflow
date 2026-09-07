import "./style.css";
import { decideContentAccess, normalizeYouTubeVideoId, parseWebVtt, type CaptionGrant, type ContentAccessDecision, type PlaybackStatus, type TimedCaption } from "./content-access.ts";

const SAMPLE_ID = "jNQXAC9IVRw";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<main class="app-shell">
  <header><div><span class="eyebrow">TECHNICAL SPIKE 2</span><h1>動画・字幕アクセス判定</h1></div><span class="secure">動画本体は保存しません</span></header>
  <section class="input-card">
    <label for="video-input">YouTube URL または動画ID</label>
    <div class="input-row"><input id="video-input" value="https://youtu.be/${SAMPLE_ID}" autocomplete="off"><button id="check">再生確認</button></div>
    <p class="hint">公式IFrame Playerの状態と、明示された字幕利用条件を別々に判定します。</p>
  </section>
  <section class="workspace">
    <div class="player-column">
      <div class="player-frame"><div id="player"></div><div id="player-placeholder">再生確認を開始してください</div></div>
      <div class="status-grid">
        <div><span>再生</span><strong id="playback-status">未確認</strong></div>
        <div><span>字幕</span><strong id="caption-status">なし</strong></div>
        <div><span>ASR</span><strong id="asr-status">無効</strong></div>
      </div>
    </div>
    <aside class="decision-card"><span class="eyebrow">CONTENT ACCESS DECISION</span><h2 id="outcome">確認待ち</h2><p id="reason">URLを確認してください。</p><ul id="capabilities"></ul></aside>
  </section>
  <section class="caption-card">
    <div><span class="eyebrow">AUTHORIZED CAPTION PATH</span><h2>時刻付き字幕を追加</h2><p>WebVTTファイルを選び、字幕を扱う権限がある場合だけ確認してください。</p></div>
    <label class="file-button">WebVTTを選択<input id="caption-file" type="file" accept=".vtt,text/vtt"></label>
    <label class="attestation"><input id="rights" type="checkbox"> この字幕を加工・学習用に保存する権限を確認しました</label>
    <p id="caption-error" role="alert"></p>
    <div id="caption-preview" class="caption-preview"></div>
  </section>
</main>`;

function el<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }
let playback: PlaybackStatus = "unchecked";
let videoId = "";
let captions: TimedCaption[] = [];
let player: { loadVideoById(id: string): void; playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void; getCurrentTime(): number; destroy(): void } | undefined;
let polling = 0;

function captionGrant(): CaptionGrant {
  const confirmed = el<HTMLInputElement>("rights").checked;
  return { source: captions.length ? "user" : "none", permission: captions.length && confirmed ? "process-and-store" : "none", language: captions.length ? "en" : undefined, version: captions.length ? `vtt-${captions.length}` : undefined, rightsConfirmed: confirmed };
}

const outcomeLabels: Record<ContentAccessDecision["outcome"], string> = {
  checking: "確認中", "view-only": "視聴のみ", "caption-display-only": "字幕表示のみ", "learning-ready": "教材化できます", "asr-eligible": "ASR候補", rejected: "利用できません",
};

function renderDecision() {
  const decision = decideContentAccess({ videoId, playback, caption: captionGrant(), asrPermissionConfirmed: false });
  el("outcome").textContent = outcomeLabels[decision.outcome];
  el("outcome").dataset.outcome = decision.outcome;
  el("reason").textContent = decision.reason;
  el("playback-status").textContent = playback === "playable" ? "再生可能" : playback === "blocked" ? "再生不可" : playback === "checking" ? "確認中" : "未確認";
  el("caption-status").textContent = decision.canStoreLearningMaterial ? "加工・保存可" : captions.length ? "権限確認待ち" : "なし";
  el("asr-status").textContent = "無効";
  el("capabilities").innerHTML = [
    ["同期字幕", decision.canSynchronizeCaptions], ["表現抽出", decision.canExtractPhrases], ["教材保存", decision.canStoreLearningMaterial],
  ].map(([label, enabled]) => `<li class="${enabled ? "yes" : "no"}"><span></span>${label}</li>`).join("");
}

function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api"; document.head.append(script);
    }
  });
}

async function verifyPlayback() {
  const normalized = normalizeYouTubeVideoId(el<HTMLInputElement>("video-input").value);
  if (!normalized) { videoId = "invalid-id"; playback = "blocked"; renderDecision(); el("reason").textContent = "YouTube URLまたは11文字の動画IDを確認してください。"; return; }
  videoId = normalized; playback = "checking"; renderDecision();
  el("player-placeholder").hidden = true;
  await loadApi();
  player?.destroy();
  player = new window.YT!.Player("player", {
    videoId,
    playerVars: { playsinline: 1, controls: 1, rel: 0 },
    events: {
      onReady: (event: { target: typeof player }) => { player = event.target; player?.playVideo(); },
      onStateChange: (event: { data: number }) => { if ([1, 2, 3, 5].includes(event.data)) { playback = "playable"; renderDecision(); } },
      onError: (event: { data: number }) => { playback = "blocked"; renderDecision(); el("reason").textContent = event.data === 100 ? "動画が削除済みまたは非公開です。" : [101, 150].includes(event.data) ? "投稿者が埋め込み再生を許可していません。" : `公式プレイヤーでエラーが発生しました（${event.data}）。`; },
    },
  });
}

function renderCaptions() {
  el("caption-preview").innerHTML = captions.map((caption) => `<button data-start="${caption.startMs}"><time>${Math.floor(caption.startMs / 1000)}s</time><span>${caption.text}</span></button>`).join("");
  el("caption-preview").querySelectorAll<HTMLButtonElement>("button").forEach((button) => button.addEventListener("click", () => {
    const iframe = document.querySelector<HTMLIFrameElement>("#player iframe");
    iframe?.focus();
    player?.seekTo(Number(button.dataset.start) / 1000, true);
    player?.playVideo();
  }));
  cancelAnimationFrame(polling);
  const paint = () => {
    const now = (player?.getCurrentTime() ?? 0) * 1000;
    el("caption-preview").querySelectorAll<HTMLButtonElement>("button").forEach((button, index) => button.classList.toggle("active", captions[index]!.startMs <= now && now < captions[index]!.endMs));
    polling = requestAnimationFrame(paint);
  };
  polling = requestAnimationFrame(paint);
}

el("check").addEventListener("click", () => void verifyPlayback());
el("rights").addEventListener("change", renderDecision);
el<HTMLInputElement>("caption-file").addEventListener("change", async (event) => {
  const file = (event.currentTarget as HTMLInputElement).files?.[0];
  if (!file) return;
  try { captions = parseWebVtt(await file.text()); el("caption-error").textContent = ""; renderCaptions(); renderDecision(); }
  catch (error) { captions = []; el("caption-error").textContent = error instanceof Error ? error.message : "字幕を読み込めませんでした。"; renderDecision(); }
});
renderDecision();
