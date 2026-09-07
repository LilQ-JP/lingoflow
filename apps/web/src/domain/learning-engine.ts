export const exerciseFormats = ["choice", "reorder", "typing"] as const;
export type ExerciseFormat = (typeof exerciseFormats)[number];
export type LearningState =
  | "new"
  | "supported"
  | "practicing"
  | "independent_candidate"
  | "independent"
  | "review_required"
  | "archived";

export interface ProgressAttempt {
  studyDay: string;
  format: ExerciseFormat;
  correct: boolean;
  firstAttempt: boolean;
  extraHintUsed: boolean;
  answerRevealed: boolean;
  retryIndex: 0 | 1 | 2;
  productionCompleted?: boolean;
}

export interface ExpressionProgress {
  expressionId: string;
  format: ExerciseFormat;
  state: LearningState;
  promotionDays: Partial<Record<ExerciseFormat, string[]>>;
  independentMeaningDays: string[];
  productionCompleted: boolean;
  everMastered: boolean;
  masteredAt?: string;
  recoveryCreditUsed: boolean;
  demotedFromFormat?: ExerciseFormat;
  demotedOnDay?: string;
  pendingDemotion: boolean;
  retryFailuresToday: number;
  retryStudyDay?: string;
  dailyExpressionClosed: boolean;
}

export function initialProgress(
  expressionId: string,
  format: ExerciseFormat = "choice",
): ExpressionProgress {
  return {
    expressionId,
    format,
    state: "new",
    promotionDays: {},
    independentMeaningDays: [],
    productionCompleted: false,
    everMastered: false,
    recoveryCreditUsed: false,
    pendingDemotion: false,
    retryFailuresToday: 0,
    dailyExpressionClosed: false,
  };
}

const formatIndex = (format: ExerciseFormat) => exerciseFormats.indexOf(format);
const previousFormat = (format: ExerciseFormat) =>
  exerciseFormats[Math.max(0, formatIndex(format) - 1)]!;
const nextFormat = (format: ExerciseFormat) =>
  exerciseFormats[
    Math.min(exerciseFormats.length - 1, formatIndex(format) + 1)
  ]!;
const unique = (values: string[]) => [...new Set(values)];

export function applyAttempt(
  current: ExpressionProgress,
  attempt: ProgressAttempt,
): ExpressionProgress {
  if (current.state === "archived") return current;
  const result: ExpressionProgress = structuredClone(current);
  if (result.retryStudyDay !== attempt.studyDay) {
    result.retryStudyDay = attempt.studyDay;
    result.retryFailuresToday = 0;
    result.dailyExpressionClosed = false;
    result.pendingDemotion = false;
  }
  if (attempt.productionCompleted) result.productionCompleted = true;

  if (
    result.everMastered &&
    (attempt.answerRevealed ||
      attempt.extraHintUsed ||
      (!attempt.correct && attempt.retryIndex === 0))
  )
    result.state = "review_required";
  if (attempt.answerRevealed) return result;

  if (!attempt.correct) {
    result.pendingDemotion = true;
    if (attempt.retryIndex > 0) result.retryFailuresToday += 1;
    if (result.retryFailuresToday >= 2) {
      const from = result.format;
      const lowerFormat = previousFormat(result.format);
      result.format = lowerFormat;
      if (lowerFormat !== from) {
        result.demotedFromFormat = from;
        result.demotedOnDay = attempt.studyDay;
      }
      result.promotionDays[from] = [];
      result.pendingDemotion = false;
      result.dailyExpressionClosed = true;
      result.state = "review_required";
    } else if (!result.everMastered) result.state = "supported";
    return result;
  }

  if (attempt.retryIndex > 0) {
    result.pendingDemotion = false;
    result.retryFailuresToday = 0;
    return result;
  }

  const promotionEligible = attempt.firstAttempt && !attempt.extraHintUsed;
  if (promotionEligible) {
    const days = unique([
      ...(result.promotionDays[attempt.format] ?? []),
      attempt.studyDay,
    ]);
    result.promotionDays[attempt.format] = days;
    const canUseRecovery =
      !result.recoveryCreditUsed &&
      result.demotedFromFormat &&
      result.demotedOnDay !== attempt.studyDay &&
      nextFormat(result.format) === result.demotedFromFormat;
    if (canUseRecovery) {
      result.format = result.demotedFromFormat!;
      result.recoveryCreditUsed = true;
      result.demotedFromFormat = undefined;
      result.demotedOnDay = undefined;
    } else if (days.length >= 2) {
      result.format = nextFormat(result.format);
      result.promotionDays[attempt.format] = [];
    }
  }

  const unassistedMeaning = attempt.format === "typing" && promotionEligible;
  if (unassistedMeaning)
    result.independentMeaningDays = unique([
      ...result.independentMeaningDays,
      attempt.studyDay,
    ]);
  if (result.state === "review_required" && unassistedMeaning)
    result.state = "independent";
  else if (
    result.independentMeaningDays.length >= 2 &&
    result.productionCompleted
  ) {
    result.state = "independent";
    result.everMastered = true;
    result.masteredAt ??= attempt.studyDay;
  } else if (result.independentMeaningDays.length >= 1)
    result.state = "independent_candidate";
  else result.state = result.format === "choice" ? "practicing" : "supported";
  return result;
}

export function archiveExpression(
  current: ExpressionProgress,
): ExpressionProgress {
  return { ...current, state: "archived", dailyExpressionClosed: true };
}
export function restoreExpression(
  current: ExpressionProgress,
): ExpressionProgress {
  return current.state === "archived"
    ? {
        ...current,
        state: current.everMastered ? "independent" : "supported",
        dailyExpressionClosed: false,
      }
    : current;
}
export function retryOffset(random: () => number = Math.random): 2 | 3 | 4 {
  return (2 + Math.min(2, Math.floor(random() * 3))) as 2 | 3 | 4;
}
