import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreSpeech, wordsOf } from "../src/speaking-practice.ts";

test("normalizes case, punctuation, and curly apostrophes", () => {
  assert.deepEqual(wordsOf("That's REALLY cool!"), ["thats", "really", "cool"]);
  assert.deepEqual(wordsOf("That’s really cool."), ["thats", "really", "cool"]);
});

test("scores a complete phrase as great", () => {
  const result = scoreSpeech(
    "And that's pretty much all.",
    "and thats pretty much all",
  );
  assert.equal(result.percent, 100);
  assert.equal(result.level, "great");

  const exact = scoreSpeech(
    "And that's pretty much all.",
    "And that's pretty much all",
  );
  assert.equal(exact.percent, 100);
  assert.equal(exact.level, "great");
  assert.ok(exact.words.every((word) => word.matched));
});

test("aligns omissions without shifting every later word", () => {
  const result = scoreSpeech(
    "really really really long trunks",
    "really really long trunks",
  );
  assert.equal(result.percent, 80);
  assert.equal(result.level, "retry");
  assert.equal(result.words.filter((word) => word.matched).length, 4);
});

test("uses the three configured result bands", () => {
  const target =
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty";
  assert.equal(
    scoreSpeech(
      target,
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen",
    ).percent,
    85,
  );
  assert.equal(
    scoreSpeech(
      target,
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen",
    ).label,
    "伝わる！",
  );
  assert.equal(
    scoreSpeech(
      target,
      "one two three four five six seven eight nine ten eleven twelve",
    ).percent,
    60,
  );
  assert.equal(
    scoreSpeech(
      target,
      "one two three four five six seven eight nine ten eleven twelve",
    ).label,
    "もう一度！",
  );
  assert.equal(
    scoreSpeech(
      target,
      "one two three four five six seven eight nine ten eleven",
    ).label,
    "要練習",
  );
});
