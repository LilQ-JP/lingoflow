import { getLearningData } from "@/server/learning-store";
import { getUserId } from "@/server/session";
import { LingoflowApp } from "@/ui/lingoflow-app";
export default async function Home() {
  const userId = await getUserId(),
    data = userId ? await getLearningData(userId) : null;
  return (
    <LingoflowApp
      initialAuthenticated={Boolean(userId)}
      initialProfile={data?.profile ?? null}
      completionCount={data?.completions.length ?? 0}
    />
  );
}
