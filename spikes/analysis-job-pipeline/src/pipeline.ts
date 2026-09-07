export const ANALYSIS_LIMIT_MS = 30 * 60 * 1000;
export const DEFAULT_REFUND_AFTER_MS = 3 * 60 * 1000;

export type AnalysisStage = "queued" | "video-check" | "caption-preparation" | "phrase-extraction" | "problem-creation" | "completed" | "failed" | "cancelled";
export type LedgerState = "reserved" | "consumed" | "released";
export type FailureKind = "material" | "system";

export interface AnalysisRange { startMs: number; endMs: number }
export interface AnalysisRequest {
  idempotencyKey: string;
  userId: string;
  videoId: string;
  videoDurationMs: number;
  range?: AnalysisRange;
  captionLanguage: string;
  captionVersion: string;
  analysisVersion: string;
}

export interface AnalysisArtifact {
  videoId: string;
  range: AnalysisRange;
  phrases: number;
  problems: number;
  generatedAt: string;
}

export interface AnalysisJob {
  id: string;
  request: AnalysisRequest;
  cacheKey: string;
  stage: AnalysisStage;
  startedAtMs: number;
  finishedAtMs?: number;
  failureKind?: FailureKind;
  failureMessage?: string;
  fromCache: boolean;
  artifact?: AnalysisArtifact;
}

export interface LedgerEvent { jobId: string; userId: string; state: LedgerState; atMs: number; reason: string }
export interface PipelineAdapters {
  checkVideo(request: AnalysisRequest, signal: AbortSignal): Promise<void>;
  prepareCaptions(request: AnalysisRequest, signal: AbortSignal): Promise<number>;
  extractPhrases(captionCount: number, signal: AbortSignal): Promise<number>;
  createProblems(phraseCount: number, signal: AbortSignal): Promise<number>;
}

export class AnalysisFailure extends Error {
  readonly kind: FailureKind;
  constructor(kind: FailureKind, message: string) { super(message); this.kind = kind; }
}

export function resolveAnalysisRange(request: AnalysisRequest): AnalysisRange {
  const range = request.range ?? { startMs: 0, endMs: request.videoDurationMs };
  if (range.startMs < 0 || range.endMs <= range.startMs || range.endMs > request.videoDurationMs) throw new AnalysisFailure("material", "学習範囲が不正です。");
  if (range.endMs - range.startMs > ANALYSIS_LIMIT_MS) throw new AnalysisFailure("material", "30分以内の連続した学習範囲を選択してください。");
  if (request.videoDurationMs > ANALYSIS_LIMIT_MS && !request.range) throw new AnalysisFailure("material", "30分を超える動画には学習範囲が必要です。");
  return range;
}

export function makeCacheKey(request: AnalysisRequest): string {
  const range = resolveAnalysisRange(request);
  return [request.videoId, request.captionLanguage, request.captionVersion, request.analysisVersion, range.startMs, range.endMs].join(":");
}

class Ledger {
  readonly events: LedgerEvent[] = [];
  private readonly stateByJob = new Map<string, LedgerState>();
  transition(jobId: string, userId: string, state: LedgerState, atMs: number, reason: string) {
    const current = this.stateByJob.get(jobId);
    if (current === state) return;
    if (current && current !== "reserved") return;
    this.stateByJob.set(jobId, state);
    this.events.push({ jobId, userId, state, atMs, reason });
  }
  state(jobId: string) { return this.stateByJob.get(jobId); }
}

export class AnalysisJobRunner {
  private sequence = 0;
  private readonly jobs = new Map<string, AnalysisJob>();
  private readonly byIdempotencyKey = new Map<string, string>();
  private readonly cache = new Map<string, AnalysisArtifact>();
  private readonly controllers = new Map<string, AbortController>();
  readonly ledger = new Ledger();
  private readonly adapters: PipelineAdapters;
  private readonly now: () => number;
  private readonly refundAfterMs: number;

  constructor(adapters: PipelineAdapters, now: () => number = Date.now, refundAfterMs = DEFAULT_REFUND_AFTER_MS) {
    this.adapters = adapters;
    this.now = now;
    this.refundAfterMs = refundAfterMs;
  }

  start(request: AnalysisRequest): { job: AnalysisJob; done: Promise<AnalysisJob> } {
    const priorId = this.byIdempotencyKey.get(request.idempotencyKey);
    if (priorId) { const prior = this.jobs.get(priorId)!; return { job: prior, done: this.waitForTerminal(prior) }; }
    const cacheKey = makeCacheKey(request);
    const cached = this.cache.get(cacheKey);
    const job: AnalysisJob = { id: `job-${++this.sequence}`, request, cacheKey, stage: cached ? "completed" : "queued", startedAtMs: this.now(), finishedAtMs: cached ? this.now() : undefined, fromCache: Boolean(cached), artifact: cached };
    this.jobs.set(job.id, job); this.byIdempotencyKey.set(request.idempotencyKey, job.id);
    if (cached) return { job, done: Promise.resolve(job) };
    this.ledger.transition(job.id, request.userId, "reserved", this.now(), "analysis-started");
    const controller = new AbortController(); this.controllers.set(job.id, controller);
    const done = this.run(job, controller.signal); (job as AnalysisJob & { done?: Promise<AnalysisJob> }).done = done;
    return { job, done };
  }

  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || ["completed", "failed", "cancelled"].includes(job.stage)) return false;
    const elapsed = this.now() - job.startedAtMs;
    const wasQueued = job.stage === "queued";
    job.stage = "cancelled"; job.finishedAtMs = this.now();
    this.controllers.get(jobId)?.abort();
    const release = elapsed >= this.refundAfterMs || wasQueued;
    this.ledger.transition(job.id, job.request.userId, release ? "released" : "consumed", this.now(), release ? "cancelled-after-threshold" : "user-cancelled-after-start");
    return true;
  }

  getJob(jobId: string) { return this.jobs.get(jobId); }
  seedCache(request: AnalysisRequest, artifact: AnalysisArtifact) { this.cache.set(makeCacheKey(request), artifact); }

  private waitForTerminal(job: AnalysisJob): Promise<AnalysisJob> {
    return (job as AnalysisJob & { done?: Promise<AnalysisJob> }).done ?? Promise.resolve(job);
  }

  private async run(job: AnalysisJob, signal: AbortSignal): Promise<AnalysisJob> {
    try {
      const range = resolveAnalysisRange(job.request);
      job.stage = "video-check"; await this.adapters.checkVideo(job.request, signal);
      job.stage = "caption-preparation"; const captions = await this.adapters.prepareCaptions(job.request, signal);
      job.stage = "phrase-extraction"; const phrases = await this.adapters.extractPhrases(captions, signal);
      job.stage = "problem-creation"; const problems = await this.adapters.createProblems(phrases, signal);
      if (signal.aborted) return job;
      job.artifact = { videoId: job.request.videoId, range, phrases, problems, generatedAt: new Date(this.now()).toISOString() };
      job.stage = "completed"; job.finishedAtMs = this.now(); this.cache.set(job.cacheKey, job.artifact);
      this.ledger.transition(job.id, job.request.userId, "consumed", this.now(), "material-generated");
    } catch (error) {
      if (signal.aborted) return job;
      const failure = error instanceof AnalysisFailure ? error : new AnalysisFailure("system", error instanceof Error ? error.message : "unknown error");
      job.stage = "failed"; job.failureKind = failure.kind; job.failureMessage = failure.message; job.finishedAtMs = this.now();
      this.ledger.transition(job.id, job.request.userId, "released", this.now(), `${failure.kind}-failure`);
    }
    return job;
  }
}

export function deterministicAdapters(): PipelineAdapters {
  const check = (signal: AbortSignal) => { if (signal.aborted) throw new DOMException("Aborted", "AbortError"); };
  return {
    async checkVideo(_request, signal) { check(signal); },
    async prepareCaptions(request, signal) { check(signal); const range = resolveAnalysisRange(request); return Math.max(1, Math.ceil((range.endMs - range.startMs) / 4000)); },
    async extractPhrases(captionCount, signal) { check(signal); return Math.max(1, Math.ceil(captionCount * 0.08)); },
    async createProblems(phraseCount, signal) { check(signal); return Math.min(3, phraseCount); },
  };
}
