import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ClozeSession,
  clozeQuestions,
  isCorrectAnswer,
  learningDay,
} from "../src/cloze-quiz.ts";

test("quiz has four unique options and one exact video answer", () => {
  for (const question of clozeQuestions) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.equal(
      question.options.filter((option) => isCorrectAnswer(question, option))
        .length,
      1,
    );
    assert.match(question.prompt, /\[ ______ \]/);
  }
});

test("answer matching allows harmless case and space differences", () => {
  assert.equal(isCorrectAnswer(clozeQuestions[2], "  PRETTY   MUCH "), true);
  assert.equal(isCorrectAnswer(clozeQuestions[2], "kind of"), false);
});

test("session requires selection, locks grading, and completes in order", () => {
  const session = new ClozeSession(clozeQuestions);
  assert.equal(session.check(), undefined);
  assert.equal(session.select("not an option"), false);
  assert.equal(session.select(session.current.answer), true);
  assert.equal(session.check(), true);
  assert.equal(session.check(), undefined);
  assert.equal(session.correct, 1);
  assert.equal(session.next(), "question");
  assert.equal(session.index, 1);

  session.select(
    session.current.options.find(
      (option) => option !== session.current.answer,
    )!,
  );
  assert.equal(session.check(), false);
  assert.equal(session.correct, 1);
  assert.equal(session.next(), "question");
  session.select(session.current.answer);
  session.check();
  assert.equal(session.next(), "complete");
  assert.equal(session.correct, 2);
});

test("learning day changes at 04:00 local time", () => {
  const beforeBoundary = new Date(2026, 8, 7, 3, 59, 59);
  const atBoundary = new Date(2026, 8, 7, 4, 0, 0);
  assert.equal(learningDay(beforeBoundary), "2026-09-06");
  assert.equal(learningDay(atBoundary), "2026-09-07");
});
