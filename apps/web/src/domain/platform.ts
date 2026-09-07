import type { ExpressionProgress } from './learning-engine.ts';
import type { CefrLevel, VideoMaterial } from './types.ts';

export interface RoadmapStep { id: string; title: string; description: string; completed: boolean }
export interface SavedWord { id: string; materialId: string; phraseId: string; word: string; meaning: string }
export interface FollowedChannel { id: string; title: string }
export interface WorkspacePreferences {
  theme: 'system' | 'light' | 'dark';
  showTranslation: boolean;
  timeZone: string;
  onboardingCompleted: boolean;
  displayName: string;
  topics: string[];
  dailyGoalMinutes: 5 | 10 | 15 | 20 | 30;
  cefr: CefrLevel;
  goal: string;
  targetSituation: string;
  challenge: string;
  ageConfirmed: boolean;
  roadmap: RoadmapStep[];
  roadmapApproved: boolean;
  savedVideoIds: string[];
  savedWords: SavedWord[];
  followedChannels: FollowedChannel[];
}
export interface WorkspaceStats {
  currentStreak: number;
  longestStreak: number;
  totalLearningDays: number;
  totalAttempts: number;
  correctAttempts: number;
  masteredExpressions: number;
  reviewRequired: number;
  todayCompleted: boolean;
  learningDay: string;
  week: { day: string; completed: boolean }[];
}
export interface WorkspaceSnapshot {
  userId: string;
  preferences: WorkspacePreferences;
  stats: WorkspaceStats;
  progress: ExpressionProgress[];
  importedMaterials: VideoMaterial[];
  authMode: 'local-development';
  aiProviderConnected: false;
}
export const defaultPreferences = (): WorkspacePreferences => ({
  theme: 'system', showTranslation: true, timeZone: 'Asia/Tokyo',
  onboardingCompleted: false, displayName: '', topics: [], dailyGoalMinutes: 10,
  cefr: 'A1', goal: '', targetSituation: '', challenge: '', ageConfirmed: false,
  roadmap: [], roadmapApproved: false, savedVideoIds: [], savedWords: [], followedChannels: [],
});

export interface YouTubeSearchItem {
  videoId: string; title: string; channelId: string; channelTitle: string;
  thumbnailUrl: string; publishedAt: string; durationSeconds: number | null;
  materialization: 'captions-required';
}
export interface YouTubeSearchResponse {
  status: 'available' | 'unavailable';
  items: YouTubeSearchItem[];
  reason?: 'api-key-not-configured' | 'quota-exceeded' | 'provider-error';
  message?: string;
  nextPageToken?: string;
}
export interface CaptionImportRequest {
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  language: 'en';
  captionVersion: string;
  source: 'user';
  rightsAttested: true;
  permission: 'process-and-store';
  vtt: string;
  segmentStartMs?: number;
  segmentEndMs?: number;
}
