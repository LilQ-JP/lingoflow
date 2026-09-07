import assert from "node:assert/strict";
import test from "node:test";
import { decideContentAccess, normalizeYouTubeVideoId, parseWebVtt } from "../src/content-access.ts";

test("normalizes supported YouTube URL shapes", () => {
  for (const value of ["jNQXAC9IVRw", "https://youtu.be/jNQXAC9IVRw?t=2", "https://www.youtube.com/watch?v=jNQXAC9IVRw", "https://youtube.com/shorts/jNQXAC9IVRw", "https://youtube.com/embed/jNQXAC9IVRw"]) assert.equal(normalizeYouTubeVideoId(value), "jNQXAC9IVRw");
  assert.equal(normalizeYouTubeVideoId("https://example.com/watch?v=jNQXAC9IVRw"), undefined);
});

test("keeps playable video view-only without a caption grant", () => {
  const result = decideContentAccess({ videoId: "jNQXAC9IVRw", playback: "playable", caption: { source: "none", permission: "none", rightsConfirmed: false }, asrPermissionConfirmed: false });
  assert.equal(result.outcome, "view-only"); assert.equal(result.canExtractPhrases, false);
});

test("allows learning only with confirmed process-and-store permission", () => {
  const result = decideContentAccess({ videoId: "jNQXAC9IVRw", playback: "playable", caption: { source: "user", permission: "process-and-store", rightsConfirmed: true, language: "en", version: "1" }, asrPermissionConfirmed: false });
  assert.equal(result.outcome, "learning-ready"); assert.equal(result.canSynchronizeCaptions, true); assert.equal(result.canStoreLearningMaterial, true);
});

test("does not turn display-only captions into learning material", () => {
  const result = decideContentAccess({ videoId: "jNQXAC9IVRw", playback: "playable", caption: { source: "licensed", permission: "display-only", rightsConfirmed: true }, asrPermissionConfirmed: false });
  assert.equal(result.outcome, "caption-display-only"); assert.equal(result.canExtractPhrases, false);
});

test("ASR remains disabled without explicit permission", () => {
  const disabled = decideContentAccess({ videoId: "jNQXAC9IVRw", playback: "playable", caption: { source: "none", permission: "none", rightsConfirmed: false }, asrPermissionConfirmed: false });
  const eligible = decideContentAccess({ videoId: "jNQXAC9IVRw", playback: "playable", caption: { source: "none", permission: "none", rightsConfirmed: false }, asrPermissionConfirmed: true });
  assert.equal(disabled.asrEligibility, "disabled"); assert.equal(eligible.outcome, "asr-eligible");
});

test("blocked playback rejects all learning capabilities", () => {
  const result = decideContentAccess({ videoId: "jNQXAC9IVRw", playback: "blocked", caption: { source: "user", permission: "process-and-store", rightsConfirmed: true }, asrPermissionConfirmed: true });
  assert.equal(result.outcome, "rejected"); assert.equal(result.canSynchronizeCaptions, false);
});

test("parses timed WebVTT captions and rejects untimed input", () => {
  const captions = parseWebVtt("WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nHello there\n\n00:03.000 --> 00:04.000\nGeneral Kenobi\n");
  assert.deepEqual(captions.map(({ startMs, endMs, text }) => ({ startMs, endMs, text })), [{ startMs: 1000, endMs: 2500, text: "Hello there" }, { startMs: 3000, endMs: 4000, text: "General Kenobi" }]);
  assert.throws(() => parseWebVtt("no timestamps"));
});
