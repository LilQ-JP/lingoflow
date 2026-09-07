import { NextResponse } from "next/server";
import { exerciseFormats, type ExerciseFormat } from "@/domain/learning-engine";
import { learningDayAt } from "@/domain/learning-day";
import { saveLearningOutcome } from "@/server/learning-store";
import { getUserId } from "@/server/session";

type AttemptRequest = {
  requestId?: string;
  materialId?: string;
  phraseId?: string;
  format?: ExerciseFormat;
  correct?: boolean;
  firstAttempt?: boolean;
  extraHintUsed?: boolean;
  answerRevealed?: boolean;
  retryIndex?: 0 | 1 | 2;
  productionCompleted?: boolean;
  timeZone?: string;
};

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json()) as AttemptRequest;
  if (
    !body.requestId ||
    !body.materialId ||
    !body.phraseId ||
    !body.format ||
    !exerciseFormats.includes(body.format) ||
    typeof body.correct !== "boolean" ||
    typeof body.firstAttempt !== "boolean" ||
    typeof body.extraHintUsed !== "boolean" ||
    typeof body.answerRevealed !== "boolean" ||
    ![0, 1, 2].includes(body.retryIndex ?? -1)
  )
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const now = new Date();
  let day: string;
  try {
    day = learningDayAt(now, body.timeZone ?? "Asia/Tokyo");
  } catch {
    return NextResponse.json({ error: "invalid_time_zone" }, { status: 400 });
  }

  const retryIndex = body.retryIndex as 0 | 1 | 2;
  const outcome = await saveLearningOutcome(
    userId,
    body.phraseId,
    {
      id: body.requestId,
      userId,
      materialId: body.materialId,
      phraseId: body.phraseId,
      exerciseFormat: body.format,
      correct: body.correct,
      hintUsed: body.extraHintUsed,
      firstAttempt: body.firstAttempt,
      answerRevealed: body.answerRevealed,
      retryIndex,
      productionCompleted: body.productionCompleted ?? false,
      occurredAt: now.toISOString(),
      learningDay: day,
    },
    null,
    {
      studyDay: day,
      format: body.format,
      correct: body.correct,
      firstAttempt: body.firstAttempt,
      extraHintUsed: body.extraHintUsed,
      answerRevealed: body.answerRevealed,
      retryIndex,
      productionCompleted: body.productionCompleted,
    },
  );
  return NextResponse.json(outcome);
}
