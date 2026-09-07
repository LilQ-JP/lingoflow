import "server-only";
import { cookies } from "next/headers";
const COOKIE = "lingoflow_session";
export async function getUserId() {
  return (await cookies()).get(COOKIE)?.value ?? null;
}
export async function setLocalSession() {
  (await cookies()).set(COOKIE, "local-pilot-user", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
