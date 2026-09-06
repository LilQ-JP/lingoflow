export interface Caption {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  translation: string;
}
export const PREROLL_MS = 700;
export function activeCaption(
  captions: readonly Caption[],
  timeMs: number,
): Caption | undefined {
  if (!Number.isFinite(timeMs) || timeMs < 0) return undefined;
  return captions.find((c) => c.startMs <= timeMs && timeMs < c.endMs);
}
export function phraseTarget(startMs: number): number {
  return Math.max(0, startMs - PREROLL_MS);
}
export function clampTime(timeMs: number, durationMs: number): number {
  return Number.isFinite(timeMs)
    ? Math.max(0, Math.min(timeMs, durationMs))
    : 0;
}
// Suppress asynchronous readings from before the most recent seek. Never let
// an older seek replace a newer request. On timeout, use actual player time.
export class SeekGuard {
  pending: { targetMs: number; requestedAt: number } | undefined;
  request(targetMs: number, now: number) {
    this.pending = { targetMs, requestedAt: now };
  }
  accept(actualMs: number, now: number): boolean {
    if (!this.pending) return true;
    if (
      Math.abs(actualMs - this.pending.targetMs) <= 400 ||
      now - this.pending.requestedAt >= 2000
    ) {
      this.pending = undefined;
      return true;
    }
    return false;
  }
}
