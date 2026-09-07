import { NextResponse } from "next/server";
import { learningDayAt } from "@/domain/learning-day";
import { saveLearningOutcome } from "@/server/learning-store";
import { InputError, parseAttempt } from "@/server/request-validation";
import { getUserId } from "@/server/session";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try {
    body = parseAttempt(await request.json());
  } catch (error) {
    const inputError = error instanceof InputError ? error : null;
    return NextResponse.json(
      { error: inputError?.code ?? "invalid_request" },
      { status: 400 },
    );
  }

  const now = new Date();
  let day: string;
  try {
    day = learningDayAt(now, body.timeZone ?? "Asia/Tokyo");
  } catch {
    return NextResponse.json({ error: "invalid_time_zone" }, { status: 400 });
  }

  const retryIndex = body.retryIndex;
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
