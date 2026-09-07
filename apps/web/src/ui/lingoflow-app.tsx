"use client";
import { useEffect, useRef, useState } from "react";
import { ja } from "@/i18n/ja";
import { sampleMaterial } from "@/domain/sample-material";
import type { UserLanguageProfile } from "@/domain/types";
type Stage = "login" | "language" | "lesson" | "quiz" | "done";
type Player = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
};
declare global {
  interface Window {
    YT?: {
      Player: new (id: string, options: Record<string, unknown>) => Player;
    };
    onYouTubeIframeAPIReady?(): void;
  }
}
export function LingoflowApp({
  initialAuthenticated,
  initialProfile,
  completionCount,
}: {
  initialAuthenticated: boolean;
  initialProfile: UserLanguageProfile | null;
  completionCount: number;
}) {
  const [stage, setStage] = useState<Stage>(
      initialAuthenticated ? (initialProfile ? "lesson" : "language") : "login",
    ),
    [active, setActive] = useState(0),
    [answer, setAnswer] = useState<string>(),
    [graded, setGraded] = useState(false),
    [savedCount, setSavedCount] = useState(completionCount);
  const player = useRef<Player | null>(null),
    timer = useRef<number | null>(null);
  useEffect(() => {
    if (stage !== "lesson") return;
    const ready = () => {
      player.current = new window.YT!.Player("youtube-player", {
        videoId: sampleMaterial.youtubeVideoId,
        playerVars: { playsinline: 1, controls: 1, rel: 0 },
        events: {
          onReady: () => {
            timer.current = window.setInterval(() => {
              const ms = (player.current?.getCurrentTime() ?? 0) * 1000,
                index = sampleMaterial.phrases.findIndex(
                  (phrase) => phrase.startMs <= ms && ms < phrase.endMs,
                );
              if (index >= 0) setActive(index);
            }, 80);
          },
        },
      });
    };
    if (window.YT?.Player) ready();
    else {
      window.onYouTubeIframeAPIReady = ready;
      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]',
        )
      ) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.append(script);
      }
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [stage]);
  async function login() {
    await fetch("/api/session", { method: "POST" });
    setStage("language");
  }
  async function chooseEnglish() {
    await fetch("/api/profile", { method: "POST" });
    setStage("lesson");
  }
  function seek(index: number) {
    const phrase = sampleMaterial.phrases[index]!;
    setActive(index);
    player.current?.seekTo(
      Math.max(0, phrase.startMs - phrase.replayPrerollMs) / 1000,
      true,
    );
    player.current?.playVideo();
  }
  async function finish() {
    const phrase = sampleMaterial.phrases[2]!,
      correct = answer === "elephants",
      response = await fetch("/api/learning/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          materialId: sampleMaterial.id,
          phraseId: phrase.id,
          correct,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
    if (response.ok) {
      setSavedCount((count) => count + 1);
      setStage("done");
    }
  }
  if (stage === "login")
    return (
      <main className="welcome">
        <div className="orb" aria-hidden />
        <span className="brand">{ja.brand}</span>
        <h1>{ja.loginTitle}</h1>
        <p>{ja.loginBody}</p>
        <button className="primary" onClick={login}>
          {ja.localLogin}
        </button>
        <small>{ja.providersPending}</small>
      </main>
    );
  if (stage === "language")
    return (
      <main className="welcome">
        <span className="step">1 / 1</span>
        <h1>{ja.chooseLanguage}</h1>
        <button className="language-card" onClick={chooseEnglish}>
          <span>EN</span>
          <strong>{ja.english}</strong>
          <small>CEFR A1から開始</small>
        </button>
        <button className="primary" onClick={chooseEnglish}>
          {ja.start}
        </button>
      </main>
    );
  if (stage === "quiz") {
    const options = ["giraffes", "entrance", "elephants", "camera"],
      correct = answer === "elephants";
    return (
      <main className="quiz-page">
        <header>
          <button className="text-button" onClick={() => setStage("lesson")}>
            閉じる
          </button>
          <div className="progress">
            <span />
          </div>
          <b>1 / 1</b>
        </header>
        <span className="kicker">VIDEO PHRASE</span>
        <h1>In front of the [ ________ ].</h1>
        <p>ゾウたちの目の前です。</p>
        <div className="options">
          {options.map((item) => (
            <button
              key={item}
              className={answer === item ? "selected" : ""}
              disabled={graded}
              onClick={() => setAnswer(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {graded && (
          <div className={correct ? "feedback good" : "feedback bad"}>
            <strong>{correct ? ja.correct : ja.incorrect}</strong>
            <span>{correct ? "Excellent!" : "正解: elephants"}</span>
          </div>
        )}
        <button
          className="primary bottom"
          disabled={!answer}
          onClick={() => (graded ? void finish() : setGraded(true))}
        >
          {graded ? ja.finish : "回答する"}
        </button>
      </main>
    );
  }
  if (stage === "done")
    return (
      <main className="welcome">
        <div className="success-mark">✓</div>
        <h1>{ja.completed}</h1>
        <p>完了した教材: {savedCount}</p>
        <button
          className="primary"
          onClick={() => {
            setAnswer(undefined);
            setGraded(false);
            setStage("lesson");
          }}
        >
          動画に戻る
        </button>
      </main>
    );
  return (
    <main className="lesson">
      <header>
        <div>
          <span className="brand">{ja.brand}</span>
          <h1>{sampleMaterial.title}</h1>
          <p>{sampleMaterial.channelTitle}</p>
        </div>
        <button
          className="quiz-button"
          onClick={() => {
            player.current?.pauseVideo();
            setStage("quiz");
          }}
        >
          {ja.quiz}
        </button>
      </header>
      <div className="video">
        <div id="youtube-player" />
      </div>
      <div className="section-title">
        <span>{ja.transcript}</span>
        <small>EN / JA</small>
      </div>
      <div className="transcript">
        {sampleMaterial.phrases.map((phrase, index) => (
          <button
            key={phrase.id}
            className={active === index ? "active" : ""}
            onClick={() => seek(index)}
          >
            <time>
              {String(Math.floor(phrase.startMs / 1000)).padStart(2, "0")}s
            </time>
            <span>
              <strong>{phrase.text}</strong>
              <small>{phrase.translation}</small>
            </span>
          </button>
        ))}
      </div>
      <button
        className="primary quiz-cta"
        onClick={() => {
          player.current?.pauseVideo();
          setStage("quiz");
        }}
      >
        {ja.quiz}
      </button>
    </main>
  );
}
