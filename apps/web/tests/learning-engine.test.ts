import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAttempt,
  archiveExpression,
  initialProgress,
  restoreExpression,
  retryOffset,
  type ProgressAttempt,
} from "../src/domain/learning-engine.ts";
const attempt = (
  overrides: Partial<ProgressAttempt> = {},
): ProgressAttempt => ({
  studyDay: "2026-09-07",
  format: "choice",
  correct: true,
  firstAttempt: true,
  extraHintUsed: false,
  answerRevealed: false,
  retryIndex: 0,
  ...overrides,
});
test("promotes only after first correct answers on two different days", () => {
  let progress = initialProgress("expression");
  progress = applyAttempt(progress, attempt());
  assert.equal(progress.format, "choice");
  progress = applyAttempt(progress, attempt());
  assert.equal(progress.format, "choice");
  progress = applyAttempt(progress, attempt({ studyDay: "2026-09-08" }));
  assert.equal(progress.format, "reorder");
});
test("answer reveal neither promotes nor demotes", () => {
  const progress = applyAttempt(
    initialProgress("expression", "reorder"),
    attempt({ format: "reorder", correct: false, answerRevealed: true }),
  );
  assert.equal(progress.format, "reorder");
  assert.equal(progress.pendingDemotion, false);
});
test("first failure is provisional and retry success cancels demotion", () => {
  let progress = applyAttempt(
    initialProgress("expression", "reorder"),
    attempt({ format: "reorder", correct: false }),
  );
  assert.equal(progress.pendingDemotion, true);
  progress = applyAttempt(
    progress,
    attempt({ format: "reorder", retryIndex: 1 }),
  );
  assert.equal(progress.pendingDemotion, false);
  assert.equal(progress.format, "reorder");
});
test("two failed retries close the expression and finalize demotion", () => {
  let progress = applyAttempt(
    initialProgress("expression", "typing"),
    attempt({ format: "typing", correct: false }),
  );
  progress = applyAttempt(
    progress,
    attempt({ format: "typing", correct: false, retryIndex: 1 }),
  );
  progress = applyAttempt(
    progress,
    attempt({ format: "typing", correct: false, retryIndex: 2 }),
  );
  assert.equal(progress.format, "reorder");
  assert.equal(progress.state, "review_required");
  assert.equal(progress.dailyExpressionClosed, true);
});
test("first recovery needs one correct answer on a later day", () => {
  let progress = initialProgress("expression", "typing");
  for (const retryIndex of [0, 1, 2] as const)
    progress = applyAttempt(
      progress,
      attempt({ format: "typing", correct: false, retryIndex }),
    );
  progress = applyAttempt(
    progress,
    attempt({ studyDay: "2026-09-08", format: "reorder" }),
  );
  assert.equal(progress.format, "typing");
  assert.equal(progress.recoveryCreditUsed, true);
});
test("mastery requires two typing days and production", () => {
  let progress = initialProgress("expression", "typing");
  progress = applyAttempt(
    progress,
    attempt({ format: "typing", productionCompleted: true }),
  );
  assert.equal(progress.state, "independent_candidate");
  progress = applyAttempt(
    progress,
    attempt({ studyDay: "2026-09-08", format: "typing" }),
  );
  assert.equal(progress.state, "independent");
  assert.equal(progress.everMastered, true);
});
test("mastered progress becomes review required without erasing achievement", () => {
  let progress = initialProgress("expression", "typing");
  progress = applyAttempt(
    progress,
    attempt({ format: "typing", productionCompleted: true }),
  );
  progress = applyAttempt(
    progress,
    attempt({ studyDay: "2026-09-08", format: "typing" }),
  );
  progress = applyAttempt(
    progress,
    attempt({ studyDay: "2026-09-10", format: "typing", correct: false }),
  );
  assert.equal(progress.state, "review_required");
  assert.equal(progress.everMastered, true);
  assert.equal(progress.masteredAt, "2026-09-08");
});
test("archive removes expression from active learning and can be restored", () => {
  const archived = archiveExpression(initialProgress("expression"));
  assert.equal(archived.state, "archived");
  assert.equal(restoreExpression(archived).state, "supported");
});
test("retry offset is always between two and four questions", () => {
  assert.equal(
    retryOffset(() => 0),
    2,
  );
  assert.equal(
    retryOffset(() => 0.5),
    3,
  );
  assert.equal(
    retryOffset(() => 0.999),
    4,
  );
});

test("daily retry failures reset on a new learning day", () => {
  let progress = applyAttempt(
    initialProgress("expression", "typing"),
    attempt({ format: "typing", correct: false }),
  );
  progress = applyAttempt(
    progress,
    attempt({ format: "typing", correct: false, retryIndex: 1 }),
  );
  progress = applyAttempt(
    progress,
    attempt({
      studyDay: "2026-09-08",
      format: "typing",
      correct: false,
      retryIndex: 1,
    }),
  );
  assert.equal(progress.retryFailuresToday, 1);
  assert.equal(progress.dailyExpressionClosed, false);
});

test("the lowest format cannot receive a recovery credit from itself", () => {
  let progress = initialProgress("expression", "choice");
  for (const retryIndex of [0, 1, 2] as const)
    progress = applyAttempt(
      progress,
      attempt({ format: "choice", correct: false, retryIndex }),
    );
  assert.equal(progress.format, "choice");
  assert.equal(progress.demotedFromFormat, undefined);
});
