import { performance } from "node:perf_hooks";
import { ANALYSIS_LIMIT_MS, AnalysisJobRunner, deterministicAdapters, type AnalysisRequest } from "../src/pipeline.ts";

const runs = 100;
const durations: number[] = [];
for (let index = 0; index < runs; index += 1) {
  const request: AnalysisRequest = { idempotencyKey: `benchmark-${index}`, userId: "benchmark-user", videoId: `fixture-${index}`, videoDurationMs: ANALYSIS_LIMIT_MS, captionLanguage: "en", captionVersion: "fixture-v1", analysisVersion: "local-v1" };
  const runner = new AnalysisJobRunner(deterministicAdapters());
  const started = performance.now(); await runner.start(request).done; durations.push(performance.now() - started);
}
durations.sort((a, b) => a - b);
const percentile = (value: number) => durations[Math.ceil((value / 100) * durations.length) - 1]!;
console.log(JSON.stringify({ fixture: "30-minute-timed-caption-simulation", runs, p50Ms: percentile(50), p95Ms: percentile(95), maxMs: durations.at(-1), note: "Local orchestration benchmark only; excludes network ASR, translation, LLM, and TTS." }, null, 2));
