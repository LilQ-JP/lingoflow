export type PlaybackStatus = "unchecked" | "checking" | "playable" | "blocked";
export type CaptionSource = "none" | "admin" | "user" | "licensed";
export type CaptionPermission = "none" | "display-only" | "process-and-store";
export type AsrEligibility = "disabled" | "eligible";
export type AccessOutcome =
  | "checking"
  | "view-only"
  | "caption-display-only"
  | "learning-ready"
  | "asr-eligible"
  | "rejected";

export interface CaptionGrant {
  source: CaptionSource;
  permission: CaptionPermission;
  language?: string;
  version?: string;
  rightsConfirmed: boolean;
}

export interface ContentAccessInput {
  videoId: string;
  playback: PlaybackStatus;
  caption: CaptionGrant;
  asrPermissionConfirmed: boolean;
  rejectionReason?: string;
}

export interface ContentAccessDecision {
  videoId: string;
  outcome: AccessOutcome;
  playback: PlaybackStatus;
  captionUsage: CaptionPermission;
  captionSource: CaptionSource;
  captionLanguage?: string;
  captionVersion?: string;
  asrEligibility: AsrEligibility;
  canSynchronizeCaptions: boolean;
  canExtractPhrases: boolean;
  canStoreLearningMaterial: boolean;
  reason: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function normalizeYouTubeVideoId(value: string): string | undefined {
  const raw = value.trim();
  if (VIDEO_ID.test(raw)) return raw;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");
    let candidate: string | null = null;
    if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") candidate = url.searchParams.get("v");
      else if (/^\/(shorts|embed)\//.test(url.pathname)) {
        candidate = url.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }
    return candidate && VIDEO_ID.test(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

export function decideContentAccess(input: ContentAccessInput): ContentAccessDecision {
  const base = {
    videoId: input.videoId,
    playback: input.playback,
    captionUsage: input.caption.permission,
    captionSource: input.caption.source,
    captionLanguage: input.caption.language,
    captionVersion: input.caption.version,
    asrEligibility: (input.asrPermissionConfirmed ? "eligible" : "disabled") as AsrEligibility,
  };
  if (input.playback === "blocked") {
    return { ...base, outcome: "rejected", canSynchronizeCaptions: false, canExtractPhrases: false, canStoreLearningMaterial: false, reason: input.rejectionReason ?? "動画を埋め込み再生できません。" };
  }
  if (input.playback === "unchecked" || input.playback === "checking") {
    return { ...base, outcome: "checking", canSynchronizeCaptions: false, canExtractPhrases: false, canStoreLearningMaterial: false, reason: "公式プレイヤーで再生可否を確認中です。" };
  }
  const grantValid = input.caption.rightsConfirmed && input.caption.source !== "none";
  if (grantValid && input.caption.permission === "process-and-store") {
    return { ...base, outcome: "learning-ready", canSynchronizeCaptions: true, canExtractPhrases: true, canStoreLearningMaterial: true, reason: "確認済み字幕を使って教材化できます。" };
  }
  if (grantValid && input.caption.permission === "display-only") {
    return { ...base, outcome: "caption-display-only", canSynchronizeCaptions: true, canExtractPhrases: false, canStoreLearningMaterial: false, reason: "字幕は表示できますが、加工や教材保存はできません。" };
  }
  if (input.asrPermissionConfirmed) {
    return { ...base, outcome: "asr-eligible", canSynchronizeCaptions: false, canExtractPhrases: false, canStoreLearningMaterial: false, reason: "ASR候補です。実行前に音声処理条件を再確認します。" };
  }
  return { ...base, outcome: "view-only", canSynchronizeCaptions: false, canExtractPhrases: false, canStoreLearningMaterial: false, reason: "再生できます。学習用字幕を提供すると教材化できます。" };
}

export interface TimedCaption {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  translation?: string;
}

function timeToMs(value: string): number {
  const parts = value.replace(",", ".").split(":").map(Number);
  if (parts.some(Number.isNaN)) throw new Error("字幕の時刻形式を確認してください。");
  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return Math.round(((hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0)) * 1000);
}

export function parseWebVtt(source: string): TimedCaption[] {
  const lines = source.replace(/^\uFEFF/, "").replace(/\r/g, "").split("\n");
  const result: TimedCaption[] = [];
  let index = 0;
  while (index < lines.length) {
    const timingIndex = lines[index]?.includes("-->") ? index : index + 1;
    const timing = lines[timingIndex];
    if (!timing?.includes("-->")) { index += 1; continue; }
    const [startRaw, endRaw] = timing.split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const textLines: string[] = [];
    index = timingIndex + 1;
    while (index < lines.length && lines[index]?.trim()) textLines.push(lines[index++]!.trim());
    const text = textLines.join(" ").replace(/<[^>]+>/g, "").trim();
    const startMs = timeToMs(startRaw!);
    const endMs = timeToMs(endRaw!);
    if (!text || endMs <= startMs) throw new Error("空の字幕または終了時刻が不正です。");
    result.push({ id: `caption-${result.length + 1}`, startMs, endMs, text });
  }
  if (!result.length) throw new Error("時刻付き字幕が見つかりませんでした。");
  for (let i = 1; i < result.length; i += 1) {
    if (result[i]!.startMs < result[i - 1]!.startMs) throw new Error("字幕の時刻順が不正です。");
  }
  return result;
}
