import { exerciseFormats, type ExerciseFormat } from '../domain/learning-engine.ts';
import { defaultPreferences, type WorkspacePreferences } from '../domain/platform.ts';

export class InputError extends Error {
  readonly code:string;
  constructor(message = '入力内容を確認してください。', code = 'invalid_request') { super(message);this.code=code; }
}
export const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
export function text(value: unknown, max = 200, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new InputError();
  return value.trim();
}
export function identifier(value: unknown): string {
  const result = text(value, 160);
  if (!/^[A-Za-z0-9_.:@-]+$/.test(result)) throw new InputError();
  return result;
}
export function boolean(value: unknown): boolean { if (typeof value !== 'boolean') throw new InputError(); return value; }
export function timeZone(value: unknown): string {
  const result = value === undefined ? 'Asia/Tokyo' : text(value, 80);
  try { new Intl.DateTimeFormat('en', { timeZone: result }).format(); } catch { throw new InputError('タイムゾーンを確認してください。', 'invalid_time_zone'); }
  return result;
}
export interface AttemptRequest {
  requestId: string; materialId: string; phraseId: string; format: ExerciseFormat;
  correct: boolean; firstAttempt: boolean; extraHintUsed: boolean; answerRevealed: boolean;
  retryIndex: 0 | 1 | 2; productionCompleted: boolean; timeZone: string; occurredAt?: string;
}
export function parseAttempt(value: unknown): AttemptRequest {
  if (!record(value) || !exerciseFormats.includes(value.format as ExerciseFormat) || ![0,1,2].includes(value.retryIndex as number)) throw new InputError();
  const result: AttemptRequest = {
    requestId: identifier(value.requestId), materialId: identifier(value.materialId), phraseId: identifier(value.phraseId), format: value.format as ExerciseFormat,
    correct: boolean(value.correct), firstAttempt: boolean(value.firstAttempt), extraHintUsed: boolean(value.extraHintUsed), answerRevealed: boolean(value.answerRevealed),
    retryIndex: value.retryIndex as 0 | 1 | 2, productionCompleted: value.productionCompleted === undefined ? false : boolean(value.productionCompleted), timeZone: timeZone(value.timeZone),
  };
  if ((result.retryIndex > 0 && result.firstAttempt) || (result.answerRevealed && result.correct)) throw new InputError();
  if (value.occurredAt !== undefined) {
    const event = text(value.occurredAt, 40), epoch = Date.parse(event), now = Date.now();
    if (!Number.isFinite(epoch) || epoch > now + 300000 || epoch < now - 30 * 86400000) throw new InputError('回答日時を確認してください。30日より前の記録は自動同期できません。', 'invalid_event_time');
    result.occurredAt = new Date(epoch).toISOString();
  }
  return result;
}
export function parseCompletion(value: unknown) {
  if (!record(value) || !Array.isArray(value.attemptIds) || value.attemptIds.length < 1 || value.attemptIds.length > 2000) throw new InputError();
  const score = value.score, total = value.total;
  if (!Number.isInteger(score) || !Number.isInteger(total) || (total as number) < 1 || (score as number) < 0 || (score as number) > (total as number)) throw new InputError();
  const attemptIds = value.attemptIds.map(identifier);
  if (new Set(attemptIds).size !== attemptIds.length) throw new InputError();
  return { requestId: identifier(value.requestId), materialId: identifier(value.materialId), score: score as number, total: total as number, timeZone: timeZone(value.timeZone), attemptIds };
}
export function parseExpressionAction(value: unknown) {
  if (!record(value) || (value.action !== 'archive' && value.action !== 'restore')) throw new InputError();
  return { phraseId: identifier(value.phraseId), action: value.action };
}
export function parseWorkspacePatch(value: unknown): Partial<WorkspacePreferences> {
  if (!record(value)) throw new InputError();
  const defaults = defaultPreferences();
  const patch: Partial<WorkspacePreferences> = {};
  for (const key of Object.keys(value)) {
    if (!(key in defaults)) throw new InputError('未対応の設定項目です。');
  }
  if (value.theme !== undefined) {
    if (!['system','light','dark'].includes(value.theme as string)) throw new InputError();
    patch.theme = value.theme as WorkspacePreferences['theme'];
  }
  for (const key of ['showTranslation','onboardingCompleted','roadmapApproved','ageConfirmed'] as const) if (value[key] !== undefined) patch[key] = boolean(value[key]);
  for (const key of ['displayName','goal','targetSituation','challenge'] as const) if (value[key] !== undefined) patch[key] = text(value[key], key === 'displayName' ? 60 : 1500, true);
  if (value.timeZone !== undefined) patch.timeZone = timeZone(value.timeZone);
  if (value.dailyGoalMinutes !== undefined) {
    if (![5,10,15,20,30].includes(value.dailyGoalMinutes as number)) throw new InputError();
    patch.dailyGoalMinutes = value.dailyGoalMinutes as WorkspacePreferences['dailyGoalMinutes'];
  }
  if (value.cefr !== undefined) {
    if (!['A1','A2','B1','B2','C1','C2'].includes(value.cefr as string)) throw new InputError();
    patch.cefr = value.cefr as WorkspacePreferences['cefr'];
  }
  if (value.topics !== undefined) {
    if (!Array.isArray(value.topics) || value.topics.length > 20) throw new InputError();
    patch.topics = [...new Set(value.topics.map(item => text(item, 80)))];
  }
  if (value.savedVideoIds !== undefined) {
    if (!Array.isArray(value.savedVideoIds) || value.savedVideoIds.length > 500) throw new InputError();
    patch.savedVideoIds = [...new Set(value.savedVideoIds.map(identifier))];
  }
  if (value.roadmap !== undefined) {
    if (!Array.isArray(value.roadmap) || value.roadmap.length > 30) throw new InputError();
    patch.roadmap = value.roadmap.map(item => {
      if (!record(item)) throw new InputError();
      return { id: identifier(item.id), title: text(item.title, 160), description: text(item.description, 800, true), completed: boolean(item.completed) };
    });
    if (new Set(patch.roadmap.map(item => item.id)).size !== patch.roadmap.length) throw new InputError();
  }
  if (value.savedWords !== undefined) {
    if (!Array.isArray(value.savedWords) || value.savedWords.length > 2000) throw new InputError();
    patch.savedWords = value.savedWords.map(item => {
      if (!record(item)) throw new InputError();
      return { id: identifier(item.id), materialId: identifier(item.materialId), phraseId: identifier(item.phraseId), word: text(item.word, 200), meaning: text(item.meaning, 1500, true) };
    });
    if (new Set(patch.savedWords.map(item => item.id)).size !== patch.savedWords.length) throw new InputError();
  }
  if (value.followedChannels !== undefined) {
    if (!Array.isArray(value.followedChannels) || value.followedChannels.length > 50) throw new InputError('フォローは50件まで登録できます。');
    patch.followedChannels = value.followedChannels.map(item => {
      if (!record(item)) throw new InputError();
      return { id: identifier(item.id), title: text(item.title, 160) };
    });
    if (new Set(patch.followedChannels.map(item => item.id)).size !== patch.followedChannels.length) throw new InputError();
  }
  return patch;
}
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site') return false;
  return origin === null || origin === new URL(request.url).origin;
}
export async function readJson(request: Request, maxBytes = 256000): Promise<unknown> {
  if (!sameOrigin(request)) throw new InputError('別のサイトからの操作は受け付けられません。', 'cross_origin');
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) throw new InputError('JSON形式で送信してください。');
  const source = await request.text();
  if (Buffer.byteLength(source) > maxBytes) throw new InputError('入力データが大きすぎます。', 'payload_too_large');
  try { return JSON.parse(source) as unknown; } catch { throw new InputError('JSONの形式を確認してください。'); }
}
