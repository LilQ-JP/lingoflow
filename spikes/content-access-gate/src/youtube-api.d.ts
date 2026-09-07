interface Window {
  YT?: {
    Player: new (elementId: string, options: Record<string, unknown>) => {
      loadVideoById(videoId: string): void;
      playVideo(): void;
      pauseVideo(): void;
      seekTo(seconds: number, allowSeekAhead: boolean): void;
      getCurrentTime(): number;
      destroy(): void;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}
