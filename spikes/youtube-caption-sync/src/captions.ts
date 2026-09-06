import type { Caption } from "./sync.ts";
export const VIDEO_ID = "jNQXAC9IVRw";
// Short manually timed excerpts, not a downloaded YouTube caption track.
// Deliberate gaps exercise the unavailable-caption state. Timings are approximate.
export const captions: readonly Caption[] = [
  {
    id: "phrase-1",
    startMs: 500,
    endMs: 1600,
    text: "All right,",
    translation: "さて、",
  },
  {
    id: "phrase-2",
    startMs: 1600,
    endMs: 2600,
    text: "so here we are",
    translation: "今いるのは、",
  },
  {
    id: "phrase-3",
    startMs: 2600,
    endMs: 4100,
    text: "in front of the elephants.",
    translation: "ゾウたちの目の前です。",
  },
  {
    id: "phrase-4",
    startMs: 7500,
    endMs: 10800,
    text: "really, really, really long trunks",
    translation: "本当に、本当に、とても長い鼻",
  },
  {
    id: "phrase-5",
    startMs: 15500,
    endMs: 18000,
    text: "And that's pretty much all",
    translation: "そして、だいたいそれくらいです。",
  },
];
