import { captions, VIDEO_ID } from "./captions.ts";
import type { Caption } from "./sync.ts";

interface Word {
  label: string;
  phonetic: string;
  pos: string;
  meaning: string;
  usage: string;
  phrase: string;
}

const words: Record<string, Word> = {
  elephants: {
    label: "elephants",
    phonetic: "/ˈelɪfənts/",
    pos: "名詞・複数形",
    meaning: "ゾウたち。elephant（ゾウ）の複数形です。",
    usage:
      "in front of the elephants で「ゾウたちの目の前に」。場所を表す in front of と一緒に覚えましょう。",
    phrase: "phrase-3",
  },
  trunks: {
    label: "trunks",
    phonetic: "/trʌŋks/",
    pos: "名詞・複数形",
    meaning: "（ゾウの）鼻。この動画ではゾウの長い鼻を指します。",
    usage:
      "trunk は「木の幹」「旅行用の大型かばん」も表します。ここでは動物の話なので「鼻」という意味です。",
    phrase: "phrase-4",
  },
  "pretty much": {
    label: "pretty much",
    phonetic: "/ˈprɪti mʌtʃ/",
    pos: "副詞句",
    meaning: "だいたい、ほとんど。この文では「ほぼそれで全部」という意味です。",
    usage:
      "pretty はここでは「かわいい」ではなく、程度を表す語。pretty much をひとまとまりで覚えましょう。",
    phrase: "phrase-5",
  },
};

const bookmarkSvg =
  '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';

export function wordMarkup(text: string): string {
  const safe = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return safe.replace(
    /elephants|trunks|pretty much/g,
    (word) =>
      `<button class="word-badge" data-word="${word}" aria-label="${word} の意味">${word}</button>`,
  );
}

export function setupLearningUI(pause: () => void) {
  const el = <T extends HTMLElement = HTMLElement>(id: string) =>
    document.getElementById(id) as T;
  const storageKey = `lingoflow-spike-ui:${VIDEO_ID}`;
  let savedWords: string[] = [];
  let savedPhrases: string[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    savedWords = Array.isArray(raw.words)
      ? raw.words.filter(
          (word: unknown) =>
            typeof word === "string" && Object.hasOwn(words, word),
        )
      : [];
    savedPhrases = Array.isArray(raw.phrases)
      ? raw.phrases.filter(
          (id: unknown) =>
            typeof id === "string" && captions.some((c) => c.id === id),
        )
      : [];
  } catch {
    // Storage is optional in the spike.
  }

  let toastTimer = 0;
  let currentWord: string | undefined;
  let activePhrase = captions[0];
  let trigger: HTMLElement | undefined;
  const sheet = el<HTMLDialogElement>("word-sheet");

  function toast(message: string) {
    clearTimeout(toastTimer);
    el("toast").textContent = message;
    el("toast").hidden = false;
    toastTimer = window.setTimeout(() => (el("toast").hidden = true), 2400);
  }

  function persist() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ words: savedWords, phrases: savedPhrases }),
      );
      return true;
    } catch {
      toast("保存できませんでした。ブラウザの保存設定をご確認ください。");
      return false;
    }
  }

  function paintWordSave() {
    const saved = !!currentWord && savedWords.includes(currentWord);
    el("save-word").innerHTML =
      bookmarkSvg + (saved ? "単語帳に保存済み" : "単語帳に保存");
    el("save-word").setAttribute("aria-pressed", String(saved));
  }

  function showSheet(
    title: string,
    phonetic: string,
    pos: string,
    meaning: string,
    phrase: Caption,
    usage: string,
    opener: HTMLElement,
  ) {
    pause();
    trigger = opener;
    el("word-title").textContent = title;
    el("word-phonetic").textContent = phonetic;
    el("word-pos").textContent = pos;
    el("word-meaning").textContent = meaning;
    el("word-example").innerHTML = wordMarkup(phrase.text);
    el("word-translation").textContent = phrase.translation;
    el("word-usage").textContent = usage;
    el("speech-state").textContent = "";
    paintWordSave();
    sheet.showModal();
    el("close-word").focus();
  }

  function openWord(key: string, opener: HTMLElement) {
    const word = words[key];
    if (!word) return;
    currentWord = key;
    const phrase = captions.find((caption) => caption.id === word.phrase)!;
    showSheet(
      word.label,
      word.phonetic,
      word.pos,
      word.meaning,
      phrase,
      word.usage,
      opener,
    );
  }

  function openExplanation(phrase: Caption, opener: HTMLElement) {
    const highlighted = Object.keys(words).find((word) =>
      phrase.text.includes(word),
    );
    if (highlighted) {
      openWord(highlighted, opener);
      return;
    }
    currentWord = undefined;
    showSheet(
      phrase.text,
      "動画の文脈",
      "フレーズ",
      `「${phrase.translation}」という意味で使われている短い話し言葉です。`,
      phrase,
      "音のつながりを動画で確認してから、同じテンポで一文をまねしてみましょう。",
      opener,
    );
  }

  function speak(
    text = currentWord ? words[currentWord].label : activePhrase.text,
  ) {
    if (!("speechSynthesis" in window)) {
      el("speech-state").textContent =
        "このブラウザは音声読み上げに対応していません。";
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    const voice =
      speechSynthesis.getVoices().find((v) => v.lang === "en-US") ??
      speechSynthesis.getVoices().find((v) => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () =>
      (el("speech-state").textContent = "発音を再生中…");
    utterance.onend = () => (el("speech-state").textContent = "");
    utterance.onerror = () =>
      (el("speech-state").textContent =
        "読み上げできませんでした。動画の音声でも確認できます。");
    speechSynthesis.speak(utterance);
  }

  el("speak-word").onclick = () => speak();
  el("speak-small").onclick = () => speak();
  el("close-word").onclick = () => sheet.close();
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
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (trigger?.isConnected) trigger.focus();
    else document.querySelector<HTMLButtonElement>("#focus-explain")?.focus();
  });
  el("save-word").onclick = () => {
    if (!currentWord) {
      toast("単語をタップすると単語帳へ保存できます");
      return;
    }
    const previous = [...savedWords];
    savedWords = savedWords.includes(currentWord)
      ? savedWords.filter((word) => word !== currentWord)
      : [...savedWords, currentWord];
    if (!persist()) savedWords = previous;
    else
      toast(
        savedWords.includes(currentWord)
          ? "単語帳に保存しました"
          : "単語帳から保存を解除しました",
      );
    paintWordSave();
  };
  function togglePhrase(phrase = activePhrase) {
    activePhrase = phrase;
    const previous = [...savedPhrases];
    savedPhrases = savedPhrases.includes(activePhrase.id)
      ? savedPhrases.filter((id) => id !== activePhrase.id)
      : [...savedPhrases, activePhrase.id];
    if (!persist()) savedPhrases = previous;
    else
      toast(
        savedPhrases.includes(activePhrase.id)
          ? "このフレーズを保存しました"
          : "フレーズの保存を解除しました",
      );
    return savedPhrases.includes(activePhrase.id);
  }

  function setActivePhrase(phrase: Caption) {
    activePhrase = phrase;
  }

  return {
    openWord,
    openExplanation,
    setActivePhrase,
    togglePhrase,
    isPhraseSaved: (id: string) => savedPhrases.includes(id),
    speak,
    toast,
  };
}
