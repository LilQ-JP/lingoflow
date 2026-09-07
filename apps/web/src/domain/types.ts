export type InterfaceLocale = "ja";
export type LearningLanguage = "en";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export interface UserLanguageProfile {
  userId: string;
  interfaceLocale: InterfaceLocale;
  supportLocale: InterfaceLocale;
  learningLanguage: LearningLanguage;
  cefr: CefrLevel;
  pronunciationGuide: boolean;
  updatedAt: string;
}
export interface CaptionPhrase {
  id: string;
  materialId: string;
  startMs: number;
  endMs: number;
  replayPrerollMs: number;
  text: string;
  translation: string;
}
export interface VideoMaterial {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  learningLanguage: LearningLanguage;
  captionSource: "admin" | "user" | "licensed";
  captionVersion: string;
  phrases: CaptionPhrase[];
}
export interface LearningAttempt {
  id: string;
  userId: string;
  materialId: string;
  phraseId: string;
  exerciseFormat: "choice" | "reorder" | "typing" | "speaking";
  correct: boolean;
  hintUsed: boolean;
  firstAttempt: boolean;
  answerRevealed: boolean;
  retryIndex: 0 | 1 | 2;
  productionCompleted: boolean;
  occurredAt: string;
  learningDay: string;
}
export interface LearningCompletion {
  id: string;
  userId: string;
  materialId: string;
  completedAt: string;
  learningDay: string;
  score: number;
  total: number;
}
export type AnalysisStage =
  | "queued"
  | "video-check"
  | "caption-preparation"
  | "phrase-extraction"
  | "problem-creation"
  | "completed"
  | "failed"
  | "cancelled";
export interface AnalysisJob {
  id: string;
  userId: string;
  videoId: string;
  stage: AnalysisStage;
  quotaState: "reserved" | "consumed" | "released";
  createdAt: string;
}
