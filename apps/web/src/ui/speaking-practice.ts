type Caption = {id:string;startMs:number;endMs:number;text:string;translation:string};

type RecognitionResultEvent = Event & {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }
  >;
};

type RecognitionErrorEvent = Event & { error: string };

interface Recognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

export interface WordScore {
  word: string;
  matched: boolean;
}

export interface SpeechScore {
  percent: number;
  level: "great" | "retry" | "practice";
  label: string;
  englishLabel: string;
  words: WordScore[];
  positive: string;
  improvement: string;
}

export function wordsOf(text: string): string[] {
  return (
    text
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .replace(/[’']/g, "")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

export function scoreSpeech(target: string, spoken: string): SpeechScore {
  const expected = wordsOf(target);
  const actual = wordsOf(spoken);
  const rows = expected.length + 1;
  const columns = actual.length + 1;
  const costs = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  );

  for (let i = 0; i < rows; i += 1) costs[i][0] = i;
  for (let j = 0; j < columns; j += 1) costs[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      costs[i][j] = Math.min(
        costs[i - 1][j] + 1,
        costs[i][j - 1] + 1,
        costs[i - 1][j - 1] + (expected[i - 1] === actual[j - 1] ? 0 : 1),
      );
    }
  }

  const matches = Array<boolean>(expected.length).fill(false);
  let i = expected.length;
  let j = actual.length;
  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      expected[i - 1] === actual[j - 1] &&
      costs[i][j] === costs[i - 1][j - 1]
    ) {
      matches[i - 1] = true;
      i -= 1;
      j -= 1;
    } else if (i > 0 && costs[i][j] === costs[i - 1][j] + 1) {
      i -= 1;
    } else if (j > 0 && costs[i][j] === costs[i][j - 1] + 1) {
      j -= 1;
    } else {
      i -= 1;
      j -= 1;
    }
  }

  const matchedCount = matches.filter(Boolean).length;
  const percent = expected.length
    ? Math.round((matchedCount / expected.length) * 100)
    : 0;
  const missed = expected.filter((_, index) => !matches[index]);
  if (percent >= 85) {
    return {
      percent,
      level: "great",
      label: "伝わる！",
      englishLabel: "Great!",
      words: expected.map((word, index) => ({ word, matched: matches[index] })),
      positive: "語順と主要な単語をクリアに伝えられました。",
      improvement:
        percent === 100
          ? "動画と同じリズムと強弱を意識して仕上げましょう。"
          : `「${missed[0]}」の音をお手本でもう一度確認しましょう。`,
    };
  }
  if (percent >= 60) {
    return {
      percent,
      level: "retry",
      label: "もう一度！",
      englishLabel: "Try again",
      words: expected.map((word, index) => ({ word, matched: matches[index] })),
      positive: "文の流れと多くの単語を捉えられています。",
      improvement: `「${missed.slice(0, 2).join(" / ")}」を区切ってから、一文でつなげてみましょう。`,
    };
  }
  return {
    percent,
    level: "practice",
    label: "要練習",
    englishLabel: "Keep practicing",
    words: expected.map((word, index) => ({ word, matched: matches[index] })),
    positive:
      matchedCount > 0
        ? `「${expected.find((_, index) => matches[index])}」は聞き取れました。`
        : "声を出して練習を始められました。",
    improvement: `まず「${missed.slice(0, 3).join(" / ")}」をゆっくり練習しましょう。`,
  };
}

export function setupSpeakingPractice(pauseVideo: () => void) {
  // Keep references while React removes the dialog during effect cleanup.
  const elements = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('#practice-sheet [id], #practice-sheet').forEach(node => elements.set(node.id, node));
  const element = <T extends HTMLElement = HTMLElement>(id: string) => elements.get(id) as T;
  const sheet = element<HTMLDialogElement>("practice-sheet");
  const mic = element<HTMLButtonElement>("practice-mic");
  const recognitionConstructor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;
  let phrase: Caption | undefined;
  let opener: HTMLElement | undefined;
  let recognition: Recognition | undefined;
  let recorder: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let chunks: Blob[] = [];
  let audioUrl: string | undefined;
  let playback: HTMLAudioElement | undefined;
  let finalTranscript = "";
  let recording = false;
  let stopTimer = 0;
  let session = 0;

  function setError(message = "") {
    const error = element("practice-error");
    error.textContent = message;
    error.hidden = !message;
  }

  function setPrompt(message: string) {
    element("practice-prompt").textContent = message;
  }

  function releaseStream() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = undefined;
  }

  function discardAudio() {
    playback?.pause();
    playback = undefined;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = undefined;
    chunks = [];
    element<HTMLButtonElement>("play-recording").disabled = true;
  }

  function stopCapture() {
    clearTimeout(stopTimer);
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.stop();
      } catch {
        // Recognition may already be stopped by the browser.
      }
      recognition = undefined;
    }
    if (recorder?.state === "recording") recorder.stop();
    else releaseStream();
    recording = false;
    mic.setAttribute("aria-pressed", "false");
    mic.setAttribute("aria-label", "録音を開始");
    mic.classList.remove("recording");
  }

  function resetResult() {
    finalTranscript = "";
    element("live-transcript").textContent = "";
    element("recognized-text").textContent = "";
    element("scored-words").replaceChildren();
    element("practice-result").hidden = true;
    element<HTMLButtonElement>("retry-practice").disabled = true;
    setError();
    discardAudio();
  }

  function showResult(transcript: string) {
    if (!phrase) return;
    finalTranscript = transcript.trim();
    if (!finalTranscript) {
      setPrompt("音声を確認できませんでした");
      setError(
        "声が聞き取れませんでした。マイクに少し近づいて、もう一度お試しください。",
      );
      element<HTMLButtonElement>("retry-practice").disabled = false;
      return;
    }
    const result = scoreSpeech(phrase.text, finalTranscript);
    const wordContainer = element("scored-words");
    wordContainer.replaceChildren(
      ...result.words.map((item) => {
        const span = document.createElement("span");
        span.className = item.matched ? "word-correct" : "word-missed";
        span.textContent = item.word;
        return span;
      }),
    );
    element("result-badge").className = `result-badge ${result.level}`;
    element("result-badge").textContent =
      `${result.label} ${result.englishLabel}`;
    element("result-score").textContent = `${result.percent}%`;
    element("recognized-text").textContent = finalTranscript;
    element("positive-feedback").textContent = result.positive;
    element("improvement-feedback").textContent = result.improvement;
    element("practice-result").hidden = false;
    element<HTMLButtonElement>("retry-practice").disabled = false;
    setPrompt("採点が完了しました");
  }

  async function beginCapture() {
    if (recording) {
      stopCapture();
      if (finalTranscript) showResult(finalTranscript);
      return;
    }
    if (!recognitionConstructor) {
      setError(
        "このブラウザは音声認識に対応していません。ChromeまたはSafariの最新版でお試しください。",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setError(
        "このブラウザではマイク録音を利用できません。対応ブラウザとHTTPS環境をご確認ください。",
      );
      return;
    }

    const currentSession = ++session;
    resetResult();
    setPrompt("マイクへのアクセスを確認しています…");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (currentSession !== session || !sheet.open) {
        releaseStream();
        return;
      }
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        if (currentSession !== session || !sheet.open) {
          chunks = [];
          releaseStream();
          return;
        }
        if (chunks.length) {
          const blob = new Blob(chunks, {
            type: recorder?.mimeType || "audio/webm",
          });
          audioUrl = URL.createObjectURL(blob);
          element<HTMLButtonElement>("play-recording").disabled = false;
        }
        releaseStream();
      };
      recognition = new recognitionConstructor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        let interim = "";
        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          const alternative = event.results[index][0];
          if (event.results[index].isFinal)
            finalTranscript += `${alternative.transcript} `;
          else interim += alternative.transcript;
        }
        element("live-transcript").textContent =
          `${finalTranscript}${interim}`.trim();
      };
      recognition.onerror = (event) => {
        const messages: Record<string, string> = {
          "not-allowed":
            "マイクの使用が許可されていません。ブラウザのサイト設定からマイクを許可してください。",
          "audio-capture":
            "マイクを利用できません。端末のマイク設定をご確認ください。",
          "no-speech":
            "声が聞き取れませんでした。静かな場所でもう一度お試しください。",
          network:
            "音声認識を開始できませんでした。ネットワーク接続をご確認ください。",
        };
        setError(
          messages[event.error] ??
            "音声認識で問題が発生しました。もう一度お試しください。",
        );
      };
      recognition.onend = () => {
        if (!recording) return;
        stopCapture();
        showResult(finalTranscript);
      };
      recorder.start();
      recognition.start();
      recording = true;
      mic.setAttribute("aria-pressed", "true");
      mic.setAttribute("aria-label", "録音を停止");
      mic.classList.add("recording");
      setPrompt("聞いています… 話し終えると自動で採点します");
      stopTimer = window.setTimeout(() => {
        if (recording) stopCapture();
        showResult(finalTranscript);
      }, 15000);
    } catch (error) {
      recognition?.abort();
      recognition = undefined;
      if (recorder?.state === "recording") recorder.stop();
      recorder = undefined;
      releaseStream();
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      setError(
        denied
          ? "マイクの使用が許可されていません。アドレスバーのサイト設定からマイクを許可してください。"
          : "マイクを開始できませんでした。接続とブラウザ設定をご確認ください。",
      );
      setPrompt("マイクを利用できません");
    }
  }

  function speak(rate: number) {
    if (!phrase) return;
    if (!("speechSynthesis" in window)) {
      setError("このブラウザはお手本音声の読み上げに対応していません。");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase.text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    const voices = speechSynthesis.getVoices();
    const voice =
      voices.find((item) => item.lang === "en-US") ??
      voices.find((item) => item.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.onerror = () =>
      setError("お手本音声を再生できませんでした。もう一度お試しください。");
    speechSynthesis.speak(utterance);
  }

  function cleanup() {
    session += 1;
    clearTimeout(stopTimer);
    recognition?.abort();
    recognition = undefined;
    if (recorder?.state === "recording") recorder.stop();
    recorder = undefined;
    releaseStream();
    discardAudio();
    recording = false;
    mic.classList.remove("recording");
    mic.setAttribute("aria-pressed", "false");
    mic.setAttribute("aria-label", "録音を開始");
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function open(nextPhrase: Caption, nextOpener: HTMLElement) {
    cleanup();
    phrase = nextPhrase;
    opener = nextOpener;
    pauseVideo();
    element("practice-title").textContent = phrase.text;
    element("practice-translation").textContent = phrase.translation;
    resetResult();
    setPrompt("マイクを押して話してください");
    sheet.showModal();
    mic.focus();
  }

  mic.onclick = () => void beginCapture();
  element("model-normal").onclick = () => speak(1);
  element("model-slow").onclick = () => speak(0.8);
  element("play-recording").onclick = () => {
    if (!audioUrl) return;
    playback?.pause();
    playback = new Audio(audioUrl);
    void playback
      .play()
      .catch(() => setError("録音した音声を再生できませんでした。"));
  };
  element("retry-practice").onclick = () => void beginCapture();
  element("close-practice").onclick = () => sheet.close();
  sheet.addEventListener("click", (event) => {
    if (event.target !== sheet) return;
    const bounds = sheet.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      sheet.close();
  });
  sheet.addEventListener("close", () => {
    cleanup();
    if (opener?.isConnected) opener.focus();
  });

  return { open, destroy: cleanup };
}
