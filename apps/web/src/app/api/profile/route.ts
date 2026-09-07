import { NextResponse } from "next/server";
import { getLearningData, saveProfile } from "@/server/learning-store";
import { getUserId } from "@/server/session";
export async function GET() {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getLearningData(userId));
}
export async function POST() {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(
    await saveProfile({
      userId,
      interfaceLocale: "ja",
      supportLocale: "ja",
      learningLanguage: "en",
      cefr: "A1",
      pronunciationGuide: false,
      updatedAt: new Date().toISOString(),
    }),
  );
}
