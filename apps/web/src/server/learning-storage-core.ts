import { AtomicJsonStore } from './atomic-store.ts';
import { applyAttempt, initialProgress, archiveExpression, restoreExpression, type ExpressionProgress, type ProgressAttempt } from '../domain/learning-engine.ts';
import { defaultPreferences, type WorkspacePreferences, type WorkspaceSnapshot, type WorkspaceStats } from '../domain/platform.ts';
import { learningDayAt } from '../domain/learning-day.ts';
import type { LearningAttempt, LearningCompletion, UserLanguageProfile, VideoMaterial } from '../domain/types.ts';
import { InputError, record } from './request-validation.ts';

type StoredCompletion = LearningCompletion & { attemptIds?: string[] };
interface StoredWorkspace { userId: string; preferences: WorkspacePreferences; importedMaterials: VideoMaterial[] }
interface StoreData {
  profiles: UserLanguageProfile[]; attempts: LearningAttempt[]; completions: StoredCompletion[];
  progress?: ExpressionProgress[]; workspaces?: StoredWorkspace[];
}
function validStore(value: unknown): value is StoreData {
  return record(value) && Array.isArray(value.profiles) && Array.isArray(value.attempts) && Array.isArray(value.completions) && (value.progress === undefined || Array.isArray(value.progress)) && (value.workspaces === undefined || Array.isArray(value.workspaces));
}
const dayBefore = (day: string) => { const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0,10); };
export function calculateStats(attempts: LearningAttempt[], completions: LearningCompletion[], progress: ExpressionProgress[], now: Date, zone: string): WorkspaceStats {
  const learningDay = learningDayAt(now, zone);
  const attemptedDays = new Set(attempts.filter(item => !item.answerRevealed).map(item => item.learningDay));
  const days = [...new Set(completions.filter(item => item.total > 0 && attemptedDays.has(item.learningDay)).map(item => item.learningDay))].sort();
  const completed = new Set(days);
  let currentStreak = 0, cursor = completed.has(learningDay) ? learningDay : dayBefore(learningDay);
  while (completed.has(cursor)) { currentStreak += 1; cursor = dayBefore(cursor); }
  let longestStreak = 0, run = 0, previous = '';
  for (const day of days) { run = dayBefore(day) === previous ? run + 1 : 1; longestStreak = Math.max(longestStreak, run); previous = day; }
  const week: WorkspaceStats['week'] = [];
  cursor = learningDay;
  for (let i = 0; i < 7; i += 1) { week.unshift({ day: cursor, completed: completed.has(cursor) }); cursor = dayBefore(cursor); }
  return { currentStreak, longestStreak, totalLearningDays: days.length, totalAttempts: attempts.length, correctAttempts: attempts.filter(item => item.correct && !item.answerRevealed).length, masteredExpressions: progress.filter(item => item.everMastered).length, reviewRequired: progress.filter(item => item.state === 'review_required').length, todayCompleted: completed.has(learningDay), learningDay, week };
}
function publicProgress(value: ExpressionProgress, userId: string) { return { ...value, expressionId: value.expressionId.slice(userId.length + 1) }; }
function sameAttempt(left: LearningAttempt, right: LearningAttempt) {
  return ['userId','materialId','phraseId','exerciseFormat','correct','hintUsed','firstAttempt','answerRevealed','retryIndex','productionCompleted'].every(key => left[key as keyof LearningAttempt] === right[key as keyof LearningAttempt]);
}

export function createLearningStore(filename: string) {
  const store = new AtomicJsonStore<StoreData>(filename, () => ({ profiles: [], attempts: [], completions: [], progress: [], workspaces: [] }), validStore);
  function workspace(data: StoreData, userId: string): StoredWorkspace {
    data.workspaces ??= [];
    let value = data.workspaces.find(item => item.userId === userId);
    if (!value) { value = { userId, preferences: defaultPreferences(), importedMaterials: [] }; data.workspaces.push(value); }
    return value;
  }
  function learningData(data: StoreData, userId: string) {
    return { profile: data.profiles.find(item => item.userId === userId) ?? null, completions: data.completions.filter(item => item.userId === userId), attempts: data.attempts.filter(item => item.userId === userId), progress: (data.progress ?? []).filter(item => item.expressionId.startsWith(`${userId}:`)).map(item => publicProgress(item,userId)) };
  }
  function snapshot(data: StoreData, userId: string, now: Date): WorkspaceSnapshot {
    const personal = workspace(data, userId), learning = learningData(data,userId);
    return { userId, preferences: personal.preferences, stats: calculateStats(learning.attempts, learning.completions, learning.progress, now, personal.preferences.timeZone), progress: learning.progress, importedMaterials: personal.importedMaterials, authMode: 'local-development', aiProviderConnected: false };
  }
  return {
    getLearningData: async (userId: string) => learningData(await store.read(), userId),
    saveProfile: async (profile: UserLanguageProfile) => store.mutate(data => {
      const index = data.profiles.findIndex(item => item.userId === profile.userId);
      if (index >= 0) data.profiles[index] = profile; else data.profiles.push(profile);
      return profile;
    }),
    getWorkspace: async (userId: string, now = new Date()) => snapshot(await store.read(), userId, now),
    patchWorkspace: async (userId: string, patch: Partial<WorkspacePreferences>, now = new Date()) => store.mutate(data => {
      const personal = workspace(data,userId);
      const next = { ...personal.preferences, ...patch };
      if (next.onboardingCompleted && (!next.ageConfirmed || !next.roadmapApproved || !next.roadmap.length)) throw new InputError('年齢確認とプランの確認を完了してください。');
      // Roadmap completion is computed from learning events in a later step, never fabricated here.
      personal.preferences = next;
      const profileIndex = data.profiles.findIndex(item => item.userId === userId);
      const profile: UserLanguageProfile = { userId, interfaceLocale: 'ja', supportLocale: 'ja', learningLanguage: 'en', cefr: next.cefr, pronunciationGuide: false, updatedAt: now.toISOString() };
      if (profileIndex >= 0) data.profiles[profileIndex] = { ...data.profiles[profileIndex], cefr: next.cefr, updatedAt: now.toISOString() }; else data.profiles.push(profile);
      return snapshot(data,userId,now);
    }),
    saveLearningOutcome: async (userId: string, expressionId: string, attempt: LearningAttempt, completion: LearningCompletion | null, _progressAttempt: ProgressAttempt) => store.mutate(data => {
      void _progressAttempt;
      if (attempt.userId !== userId || attempt.phraseId !== expressionId || (completion && completion.userId !== userId)) throw new InputError();
      data.progress ??= [];
      const scopedId = `${userId}:${expressionId}`;
      const index = data.progress.findIndex(item => item.expressionId === scopedId);
      const old = index >= 0 ? data.progress[index]! : undefined;
      const existing = data.attempts.find(item => item.userId === userId && item.id === attempt.id);
      if (existing) {
        if (!sameAttempt(existing, attempt)) throw new InputError('同じ回答IDに異なる内容が送られました。', 'idempotency_conflict');
        return { completion: completion ? data.completions.find(item => item.userId === userId && item.id === completion.id) ?? null : null, progress: publicProgress(old ?? initialProgress(scopedId), userId), inserted: false };
      }
      data.attempts.push(attempt);
      if (completion) {
        if (data.completions.some(item => item.userId === userId && item.id === completion.id)) throw new InputError('完了IDが重複しています。', 'idempotency_conflict');
        data.completions.push({ ...completion, attemptIds: [attempt.id] });
      }
      const attempts = data.attempts.filter(item => item.userId === userId && item.phraseId === expressionId).sort((a,b) => a.occurredAt.localeCompare(b.occurredAt));
      const initialFormat = attempts[0]?.exerciseFormat === 'speaking' ? 'typing' : attempts[0]?.exerciseFormat ?? 'choice';
      let next = initialProgress(scopedId, initialFormat);
      for (const event of attempts) next = applyAttempt(next, { studyDay: event.learningDay, format: event.exerciseFormat === 'speaking' ? 'typing' : event.exerciseFormat, correct: event.correct, firstAttempt: event.firstAttempt, extraHintUsed: event.hintUsed, answerRevealed: event.answerRevealed, retryIndex: event.retryIndex, productionCompleted: event.productionCompleted });
      if (old?.everMastered) { next.everMastered = true; next.masteredAt ??= old.masteredAt; }
      if (old?.state === 'archived') next = archiveExpression(next);
      if (index >= 0) data.progress[index] = next; else data.progress.push(next);
      return { completion, progress: publicProgress(next,userId), inserted: true };
    }),
    saveSessionCompletion: async (userId: string, input: { requestId: string; materialId: string; score: number; total: number; attemptIds: string[] }) => store.mutate(data => {
      const id = `session-${input.requestId}`;
      const previous = data.completions.find(item => item.userId === userId && item.id === id);
      if (previous) {
        if (previous.materialId !== input.materialId || previous.score !== input.score || previous.total !== input.total || JSON.stringify(previous.attemptIds) !== JSON.stringify(input.attemptIds)) throw new InputError('完了IDに異なる結果が送られました。', 'idempotency_conflict');
        return { completion: previous, inserted: false };
      }
      const attempts = input.attemptIds.map(attemptId => data.attempts.find(item => item.userId === userId && item.id === attemptId && item.materialId === input.materialId));
      if (attempts.some(item => !item)) throw new InputError('保存されていない回答が含まれています。', 'missing_attempts');
      const initial = attempts.filter((item): item is LearningAttempt => Boolean(item && item.retryIndex === 0 && !item.answerRevealed));
      const total = initial.length, score = initial.filter(item => item.correct).length;
      if (!total || total !== input.total || score !== input.score) throw new InputError('保存済み回答と結果が一致しません。', 'completion_mismatch');
      const last = [...initial].sort((a,b) => a.occurredAt.localeCompare(b.occurredAt)).at(-1)!;
      const completion: StoredCompletion = { id, userId, materialId: input.materialId, score, total, learningDay: last.learningDay, completedAt: last.occurredAt, attemptIds: input.attemptIds };
      data.completions.push(completion);
      return { completion, inserted: true };
    }),
    expressionAction: async (userId: string, phraseId: string, action: 'archive' | 'restore') => store.mutate(data => {
      data.progress ??= [];
      const scopedId = `${userId}:${phraseId}`;
      const index = data.progress.findIndex(item => item.expressionId === scopedId);
      const old = index >= 0 ? data.progress[index]! : initialProgress(scopedId);
      const next = action === 'archive' ? archiveExpression(old) : restoreExpression(old);
      if (index >= 0) data.progress[index] = next; else data.progress.push(next);
      return { progress: publicProgress(next,userId) };
    }),
    importMaterial: async (userId: string, material: VideoMaterial) => store.mutate(data => {
      const personal = workspace(data,userId);
      const index = personal.importedMaterials.findIndex(item => item.id === material.id);
      if (index >= 0) personal.importedMaterials[index] = material;
      else { if (personal.importedMaterials.length >= 100) throw new InputError('保存できる教材は100件までです。'); personal.importedMaterials.push(material); }
      personal.preferences.savedVideoIds = [...new Set([...personal.preferences.savedVideoIds, material.id])];
      return material;
    }),
  };
}
