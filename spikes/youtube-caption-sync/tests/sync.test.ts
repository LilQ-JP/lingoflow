import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeCaption,
  phraseTarget,
  SeekGuard,
  clampTime,
} from "../src/sync.ts";
import { captions } from "../src/captions.ts";
test("start inclusive, end exclusive, adjacent phrase and deliberate gaps", () => {
  assert.equal(activeCaption(captions, 499), undefined);
  assert.equal(activeCaption(captions, 500)?.id, "phrase-1");
  assert.equal(activeCaption(captions, 1599)?.id, "phrase-1");
  assert.equal(activeCaption(captions, 1600)?.id, "phrase-2");
  assert.equal(activeCaption(captions, 4100), undefined);
  assert.equal(activeCaption(captions, 18000), undefined);
  assert.equal(activeCaption(captions, NaN), undefined);
});
test("preroll is 700ms and never negative", () => {
  assert.equal(phraseTarget(500), 0);
  assert.equal(phraseTarget(7500), 6800);
});
test("rapid seek supersedes old target and ignores stale player time", () => {
  const guard = new SeekGuard();
  guard.request(6800, 0);
  guard.request(1900, 20);
  assert.equal(guard.accept(6800, 30), false);
  assert.equal(guard.accept(1920, 100), true);
  assert.equal(guard.pending, undefined);
});
test("seek timeout releases real time instead of freezing on requested time", () => {
  const guard = new SeekGuard();
  guard.request(6800, 0);
  assert.equal(guard.accept(1000, 1999), false);
  assert.equal(guard.accept(1000, 2000), true);
});
test("seek clamp and ordered non-overlapping fixture", () => {
  assert.equal(clampTime(30000, 19000), 19000);
  assert.equal(clampTime(-100, 19000), 0);
  captions.forEach((c, i) => {
    assert.ok(c.startMs < c.endMs);
    if (i) assert.ok(c.startMs >= captions[i - 1].endMs);
  });
});
