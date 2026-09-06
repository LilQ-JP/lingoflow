export interface Player {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}
interface PlayerEvent {
  target: Player;
  data: number;
}
interface Options {
  videoId: string;
  width: string;
  height: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady(e: PlayerEvent): void;
    onStateChange(e: PlayerEvent): void;
    onError(e: PlayerEvent): void;
    onAutoplayBlocked(): void;
  };
}
declare global {
  interface Window {
    YT?: { Player: new (id: string, options: Options) => Player };
    onYouTubeIframeAPIReady?: () => void;
  }
}
export function loadYouTube(): Promise<NonNullable<Window["YT"]>> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("YouTubeへの接続がタイムアウトしました。")),
      15000,
    );
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("YouTube APIを読み込めませんでした。"));
    };
    document.head.append(script);
  });
}
