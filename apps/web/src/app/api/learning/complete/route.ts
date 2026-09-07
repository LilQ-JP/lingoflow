import { NextResponse } from "next/server";
import { learningDayAt } from "@/domain/learning-day";
import { saveLearningResult } from "@/server/learning-store";
import { getUserId } from "@/server/session";

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    requestId?: string;
    materialId?: string;
    phraseId?: string;
    correct?: boolean;
    timeZone?: string;
  };
  if (
    !body.requestId ||
    !body.materialId ||
    !body.phraseId ||
    typeof body.correct !== "boolean"
  )
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const now = new Date();
  let day: string;
  try {
    day = learningDayAt(now, body.timeZone ?? "Asia/Tokyo");
  } catch {
    return NextResponse.json({ error: "invalid_time_zone" }, { status: 400 });
  }
  return NextResponse.json(
    await saveLearningResult(
      {
        id: body.requestId,
        userId,
        materialId: body.materialId,
        phraseId: body.phraseId,
        exerciseFormat: "choice",
        correct: body.correct,
        hintUsed: false,
        occurredAt: now.toISOString(),
        learningDay: day,
      },
      {
        id: `completion-${body.requestId}`,
        userId,
        materialId: body.materialId,
        completedAt: now.toISOString(),
        learningDay: day,
        score: body.correct ? 1 : 0,
        total: 1,
      },
    ),
  );
}
