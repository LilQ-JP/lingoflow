import assert from "node:assert/strict";
import test from "node:test";
import { learningDayAt } from "../src/domain/learning-day.ts";
test("Asia/Tokyo learning day changes at 04:00", () => {
  assert.equal(
    learningDayAt(new Date("2026-09-06T18:59:59Z"), "Asia/Tokyo"),
    "2026-09-06",
  );
  assert.equal(
    learningDayAt(new Date("2026-09-06T19:00:00Z"), "Asia/Tokyo"),
    "2026-09-07",
  );
});
test("learning day respects the supplied IANA time zone", () => {
  const instant = new Date("2026-09-07T08:00:00Z");
  assert.equal(learningDayAt(instant, "Asia/Tokyo"), "2026-09-07");
  assert.equal(learningDayAt(instant, "America/Los_Angeles"), "2026-09-06");
});
