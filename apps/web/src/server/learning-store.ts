import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  LearningAttempt,
  LearningCompletion,
  UserLanguageProfile,
} from "@/domain/types";
interface StoreData {
  profiles: UserLanguageProfile[];
  attempts: LearningAttempt[];
  completions: LearningCompletion[];
}
const dataDirectory = path.join(process.cwd(), ".data"),
  dataFile = path.join(dataDirectory, "learning-records.json");
let writeQueue: Promise<void> = Promise.resolve();
async function readStore(): Promise<StoreData> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { profiles: [], attempts: [], completions: [] };
    throw error;
  }
}
async function writeStore(data: StoreData) {
  await mkdir(dataDirectory, { recursive: true });
  const temporary = `${dataFile}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(temporary, dataFile);
}
async function mutate<T>(
  change: (data: StoreData) => T | Promise<T>,
): Promise<T> {
  let result!: T;
  writeQueue = writeQueue.then(async () => {
    const data = await readStore();
    result = await change(data);
    await writeStore(data);
  });
  await writeQueue;
  return result;
}
export async function getLearningData(userId: string) {
  await writeQueue;
  const data = await readStore();
  return {
    profile: data.profiles.find((item) => item.userId === userId) ?? null,
    completions: data.completions.filter((item) => item.userId === userId),
    attempts: data.attempts.filter((item) => item.userId === userId),
  };
}
export async function saveProfile(profile: UserLanguageProfile) {
  return mutate((data) => {
    const index = data.profiles.findIndex(
      (item) => item.userId === profile.userId,
    );
    if (index >= 0) data.profiles[index] = profile;
    else data.profiles.push(profile);
    return profile;
  });
}
export async function saveLearningResult(
  attempt: LearningAttempt,
  completion: LearningCompletion,
) {
  return mutate((data) => {
    if (!data.attempts.some((item) => item.id === attempt.id))
      data.attempts.push(attempt);
    if (!data.completions.some((item) => item.id === completion.id))
      data.completions.push(completion);
    return completion;
  });
}
