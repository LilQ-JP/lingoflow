import { captions, VIDEO_ID } from "./captions.ts";
import type { Caption } from "./sync.ts";

export interface ClozeQuestion {
  id: string;
  captionId: string;
  prompt: string;
  answer: string;
  options: readonly [string, string, string, string];
  translation: string;
  explanation: string;
}

export const clozeQuestions: readonly ClozeQuestion[] = [
  {
    id: "cloze-elephants",
    captionId: "phrase-3",
    prompt: "in front of the [ ______ ].",
    answer: "elephants",
    options: ["elephants", "entrance", "giraffes", "camera"],
    translation: "ゾウたちの目の前です。",
    explanation:
      "in front of the elephants で「ゾウたちの目の前に」。動画で使われた elephants を思い出しましょう。",
  },
  {
    id: "cloze-long-trunks",
    captionId: "phrase-4",
    prompt: "really, really, really [ ______ ]",
    answer: "long trunks",
    options: ["long trunks", "big ears", "slow steps", "tall animals"],
    translation: "本当に、本当に、とても長い鼻",
    explanation:
      "long trunks は「長い鼻」。形容詞 long と複数形 trunks をひとかたまりで覚えます。",
  },
  {
    id: "cloze-pretty-much",
    captionId: "phrase-5",
    prompt: "And that's [ ______ ] all",
    answer: "pretty much",
    options: ["pretty much", "very nearly", "kind of", "almost done"],
    translation: "そして、だいたいそれくらいです。",
    explanation:
      "pretty much all で「だいたいそれで全部」。動画の言い回し pretty much をそのまま身につけます。",
  },
];

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");
}

export function isCorrectAnswer(question: ClozeQuestion, answer: string) {
  return normalizeAnswer(question.answer) === normalizeAnswer(answer);
}

export function learningDay(date = new Date()): string {
  const shifted = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, "0");
  const day = String(shifted.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class ClozeSession {
  index = 0;
  correct = 0;
  selected: string | undefined;
  checked = false;
  readonly questions: readonly ClozeQuestion[];

  constructor(questions: readonly ClozeQuestion[]) {
    if (!questions.length)
      throw new Error("A quiz needs at least one question.");
    this.questions = questions;
  }

  get current() {
    return this.questions[this.index];
  }

  select(answer: string) {
    if (this.checked || !this.current.options.includes(answer)) return false;
    this.selected = answer;
    return true;
  }

  check(): boolean | undefined {
    if (!this.selected || this.checked) return undefined;
    this.checked = true;
    const correct = isCorrectAnswer(this.current, this.selected);
    if (correct) this.correct += 1;
    return correct;
  }

  next(): "question" | "complete" {
    if (!this.checked) return "question";
    if (this.index >= this.questions.length - 1) return "complete";
    this.index += 1;
    this.selected = undefined;
    this.checked = false;
    return "question";
  }
}

const icons = {
  close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  sound:
    '<svg viewBox="0 0 24 24"><path d="M5 10v4h4l5 4V6l-5 4Z"/><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
  trophy:
    '<svg viewBox="0 0 24 24"><path d="M8 3h8v5a4 4 0 0 1-8 0Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/></svg>',
  retry:
    '<svg viewBox="0 0 24 24"><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></svg>',
  video:
    '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></svg>',
};

function shuffled<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function playFeedbackSound(correct: boolean) {
  if (!("AudioContext" in window)) return;
  const context = new AudioContext();
  const now = context.currentTime;
  const frequencies = correct ? [523.25, 659.25, 783.99] : [311.13, 233.08];
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * (correct ? 0.075 : 0.11);
    oscillator.type = correct ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
  window.setTimeout(() => void context.close(), 650);
}

interface QuizDependencies {
  pauseVideo: () => void;
  playPhrase: (caption: Caption) => void;
}

interface CompletionRecord {
  videoId: string;
  completedAt: string;
  learningDay: string;
  correct: number;
  total: number;
  xp: number;
}

export function setupClozeQuiz({ pauseVideo, playPhrase }: QuizDependencies) {
  const element = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const sheet = element<HTMLDialogElement>("quiz-sheet");
  sheet.innerHTML = `
    <section id="quiz-question-screen" class="quiz-screen">
      <header class="quiz-header">
        <button id="close-quiz" class="quiz-close" aria-label="クイズを閉じる">${icons.close}</button>
        <div id="quiz-progress" class="quiz-progress" role="progressbar" aria-label="クイズの進捗" aria-valuemin="0" aria-valuemax="3"><span id="quiz-progress-fill"></span></div>
        <output id="quiz-progress-text">1 / 3</output>
      </header>
      <main class="quiz-body">
        <div class="quiz-kicker"><span>Video Phrase</span><strong>4択</strong></div>
        <button id="listen-phrase" class="listen-phrase">${icons.sound}<span>フレーズを聴く</span></button>
        <article class="cloze-card">
          <p class="cloze-instruction">空欄に入る表現を選んでください</p>
          <h2 id="quiz-title"></h2>
          <p id="quiz-translation"></p>
        </article>
        <div id="quiz-options" class="quiz-options" role="group" aria-label="選択肢"></div>
      </main>
      <footer class="quiz-footer">
        <button id="submit-quiz" class="quiz-submit" disabled>回答する</button>
        <section id="quiz-feedback" class="quiz-feedback" role="status" hidden>
          <div class="feedback-title"><span id="feedback-icon">${icons.check}</span><div><strong id="feedback-heading"></strong><p id="feedback-answer"></p></div></div>
          <p id="feedback-explanation"></p>
          <button id="next-question" class="quiz-next"><span>次へ進む</span>${icons.next}</button>
        </section>
      </footer>
    </section>
    <section id="quiz-result-screen" class="quiz-result-screen" hidden>
      <div class="result-emblem">${icons.trophy}</div>
      <p class="result-eyebrow">Cloze Quiz Complete</p>
      <h2>セッション完了！</h2>
      <p>動画の表現をアウトプットできました。</p>
      <div class="quiz-score-card"><div><span>正答率</span><strong id="quiz-final-score"></strong></div><div><span>獲得スコア</span><strong id="quiz-xp"></strong></div></div>
      <button id="retry-quiz" class="quiz-result-primary">${icons.retry}<span>もう一度挑戦</span></button>
      <button id="return-video" class="quiz-result-secondary">${icons.video}<span>動画に戻る</span></button>
    </section>`;

  let session = new ClozeSession(clozeQuestions);
  let optionOrder: string[] = [];
  let opener: HTMLElement | undefined;
  let saved = false;

  function captionFor(question: ClozeQuestion) {
    const caption = captions.find((item) => item.id === question.captionId);
    if (!caption) throw new Error(`Caption not found: ${question.captionId}`);
    return caption;
  }

  function paintOptions() {
    const container = element("quiz-options");
    container.replaceChildren(
      ...optionOrder.map((option, index) => {
        const button = document.createElement("button");
        button.className = "quiz-option";
        button.dataset.answer = option;
        button.setAttribute(
          "aria-pressed",
          String(session.selected === option),
        );
        button.disabled = session.checked;
        button.innerHTML = `<span class="option-index">${index + 1}</span><span class="option-copy"></span><span class="option-check">${icons.check}</span>`;
        button.querySelector(".option-copy")!.textContent = option;
        button.onclick = () => {
          if (!session.select(option)) return;
          paintOptions();
          element<HTMLButtonElement>("submit-quiz").disabled = false;
        };
        return button;
      }),
    );
  }

  function renderQuestion() {
    pauseVideo();
    const question = session.current;
    optionOrder = shuffled(question.options);
    element("quiz-title").textContent = question.prompt;
    element("quiz-translation").textContent = question.translation;
    element("quiz-progress-text").textContent =
      `${session.index + 1} / ${session.questions.length}`;
    const percent = ((session.index + 1) / session.questions.length) * 100;
    element("quiz-progress-fill").style.width = `${percent}%`;
    const progress = element("quiz-progress");
    progress.setAttribute("aria-valuemax", String(session.questions.length));
    progress.setAttribute("aria-valuenow", String(session.index + 1));
    element("quiz-feedback").hidden = true;
    element("submit-quiz").hidden = false;
    element<HTMLButtonElement>("submit-quiz").disabled = true;
    paintOptions();
    element<HTMLButtonElement>("listen-phrase").focus();
  }

  function saveCompletion() {
    if (saved) return;
    saved = true;
    const key = "lingoflow-cloze-completions";
    const record: CompletionRecord = {
      videoId: VIDEO_ID,
      completedAt: new Date().toISOString(),
      learningDay: learningDay(),
      correct: session.correct,
      total: session.questions.length,
      xp: session.correct * 5,
    };
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
      const records = Array.isArray(parsed) ? parsed.slice(-99) : [];
      localStorage.setItem(key, JSON.stringify([...records, record]));
    } catch {
      // Completion remains visible even when storage is unavailable.
    }
  }

  function showResult() {
    pauseVideo();
    saveCompletion();
    element("quiz-question-screen").hidden = true;
    element("quiz-result-screen").hidden = false;
    element("quiz-final-score").textContent =
      `${session.correct} / ${session.questions.length}`;
    element("quiz-xp").textContent = `+${session.correct * 5} XP`;
    element<HTMLButtonElement>("retry-quiz").focus();
  }

  function restart() {
    session = new ClozeSession(clozeQuestions);
    saved = false;
    element("quiz-question-screen").hidden = false;
    element("quiz-result-screen").hidden = true;
    renderQuestion();
  }

  element("close-quiz").onclick = () => sheet.close();
  element("listen-phrase").onclick = () =>
    playPhrase(captionFor(session.current));
  element("submit-quiz").onclick = () => {
    const correct = session.check();
    if (correct === undefined) return;
    pauseVideo();
    playFeedbackSound(correct);
    paintOptions();
    const feedback = element("quiz-feedback");
    feedback.className = `quiz-feedback ${correct ? "correct" : "incorrect"}`;
    element("feedback-heading").textContent = correct
      ? "正解！ Excellent!"
      : "おしい！";
    element("feedback-answer").textContent = correct
      ? session.current.answer
      : `正解: ${session.current.answer}`;
    element("feedback-explanation").textContent = session.current.explanation;
    element("feedback-icon").innerHTML = correct ? icons.check : icons.close;
    element("submit-quiz").hidden = true;
    feedback.hidden = false;
    element<HTMLButtonElement>("next-question").focus();
  };
  element("next-question").onclick = () => {
    if (session.next() === "complete") showResult();
    else renderQuestion();
  };
  element("retry-quiz").onclick = restart;
  element("return-video").onclick = () => sheet.close();
  sheet.addEventListener("close", () => {
    pauseVideo();
    if (opener?.isConnected) opener.focus();
  });

  function open(nextOpener: HTMLElement) {
    pauseVideo();
    opener = nextOpener;
    sheet.showModal();
    restart();
    element<HTMLButtonElement>("listen-phrase").focus();
  }

  return {
    open,
    destroy: () => {
      pauseVideo();
      if (sheet.open) sheet.close();
    },
  };
}
