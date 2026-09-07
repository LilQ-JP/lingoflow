import assert from "node:assert/strict";
import test from "node:test";
import { ANALYSIS_LIMIT_MS, AnalysisFailure, AnalysisJobRunner, deterministicAdapters, makeCacheKey, resolveAnalysisRange, type AnalysisRequest, type PipelineAdapters } from "../src/pipeline.ts";

const request = (overrides: Partial<AnalysisRequest> = {}): AnalysisRequest => ({ idempotencyKey: "attempt-1", userId: "anonymous-user", videoId: "video000001", videoDurationMs: ANALYSIS_LIMIT_MS, captionLanguage: "en", captionVersion: "captions-v1", analysisVersion: "analysis-v1", ...overrides });

test("accepts a 30-minute range and requires a range for longer videos", () => {
  assert.equal(resolveAnalysisRange(request()).endMs, ANALYSIS_LIMIT_MS);
  assert.throws(() => resolveAnalysisRange(request({ videoDurationMs: ANALYSIS_LIMIT_MS + 1 })), AnalysisFailure);
  assert.equal(resolveAnalysisRange(request({ videoDurationMs: 60 * 60 * 1000, range: { startMs: 5_000, endMs: 5_000 + ANALYSIS_LIMIT_MS } })).startMs, 5_000);
});

test("cache key includes caption, analysis version, and selected range", () => {
  assert.notEqual(makeCacheKey(request()), makeCacheKey(request({ analysisVersion: "analysis-v2" })));
  assert.notEqual(makeCacheKey(request()), makeCacheKey(request({ captionVersion: "captions-v2" })));
});

test("successful job runs five stages and consumes exactly once", async () => {
  const runner = new AnalysisJobRunner(deterministicAdapters());
  const { job, done } = runner.start(request()); await done;
  assert.equal(job.stage, "completed"); assert.equal(job.artifact?.problems, 3);
  assert.deepEqual(runner.ledger.events.map((event) => event.state), ["reserved", "consumed"]);
});

test("same idempotency key returns the same job without double charging", async () => {
  const runner = new AnalysisJobRunner(deterministicAdapters());
  const first = runner.start(request()); const second = runner.start(request());
  await Promise.all([first.done, second.done]); assert.equal(first.job.id, second.job.id); assert.equal(runner.ledger.events.length, 2);
});

test("a shared cache hit creates no quota ledger event", async () => {
  const runner = new AnalysisJobRunner(deterministicAdapters());
  const cachedRequest = request({ idempotencyKey: "seed" });
  runner.seedCache(cachedRequest, { videoId: cachedRequest.videoId, range: resolveAnalysisRange(cachedRequest), phrases: 20, problems: 3, generatedAt: new Date(0).toISOString() });
  const { job, done } = runner.start(request({ idempotencyKey: "other-user-attempt", userId: "other-user" })); await done;
  assert.equal(job.fromCache, true); assert.equal(runner.ledger.events.length, 0);
});

test("material and system failures release quota", async () => {
  for (const failure of [new AnalysisFailure("material", "captions missing"), new Error("provider unavailable")]) {
    const adapters: PipelineAdapters = { ...deterministicAdapters(), async prepareCaptions() { throw failure; } };
    const runner = new AnalysisJobRunner(adapters); const { job, done } = runner.start(request()); await done;
    assert.equal(job.stage, "failed"); assert.equal(runner.ledger.state(job.id), "released");
  }
});

test("cancellation after three minutes releases quota and is idempotent", async () => {
  let clock = 0; let releaseStage!: () => void;
  const gate = new Promise<void>((resolve) => { releaseStage = resolve; });
  const adapters: PipelineAdapters = { ...deterministicAdapters(), async checkVideo(_request, signal) { await gate; if (signal.aborted) throw new DOMException("Aborted", "AbortError"); } };
  const runner = new AnalysisJobRunner(adapters, () => clock);
  const { job, done } = runner.start(request()); clock = 180_001;
  assert.equal(runner.cancel(job.id), true); assert.equal(runner.cancel(job.id), false); releaseStage(); await done;
  assert.equal(job.stage, "cancelled"); assert.deepEqual(runner.ledger.events.map((event) => event.state), ["reserved", "released"]);
});

test("user cancellation after processing starts and before threshold consumes quota", async () => {
  let clock = 0; let releaseStage!: () => void;
  const gate = new Promise<void>((resolve) => { releaseStage = resolve; });
  const adapters: PipelineAdapters = { ...deterministicAdapters(), async checkVideo(_request, signal) { await gate; if (signal.aborted) throw new DOMException("Aborted", "AbortError"); } };
  const runner = new AnalysisJobRunner(adapters, () => clock);
  const { job, done } = runner.start(request()); clock = 10_000;
  runner.cancel(job.id); releaseStage(); await done;
  assert.equal(runner.ledger.state(job.id), "consumed");
});
