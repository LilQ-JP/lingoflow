import { NextResponse } from "next/server";
import { setLocalSession } from "@/server/session";
export async function POST() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.LINGOFLOW_ENABLE_LOCAL_AUTH !== "true"
  )
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  await setLocalSession();
  return NextResponse.json({ ok: true });
}
