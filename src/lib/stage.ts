// A tiny external store shared by the WebGL scene and the DOM.
import type { ClothSim } from "./cloth";

type State = { chapter: number; held: number; ready: boolean; grabbing: boolean; near: boolean; piece: number };

let state: State = { chapter: 0, held: 0, ready: false, grabbing: false, near: false, piece: 0 };
const listeners = new Set<() => void>();

export const stage = {
  sim: null as ClothSim | null,
  get: () => state,
  set(patch: Partial<State>) {
    let changed = false;
    for (const k in patch) {
      if (state[k as keyof State] !== patch[k as keyof State]) changed = true;
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

type V3 = [number, number, number];
export type Chapter = {
  id: string;
  bg: string;
  fg: string;
  accent: string;
  light: number; // 0 = lit like a stage in the dark, 1 = daylight
  cloth: number; // 0 undyed, 1 àlàárì, 2 àdìrẹ, 3 sányán
  cam: V3;
  look: V3;
  key: V3;
  wind: V3;
  gust: number;
};

const FRONT: V3 = [0, 1.24, 4.5];
const AT: V3 = [0, 1.24, 0.3];

export const CHAPTERS: Chapter[] = [
  { id: "curtain", bg: "#0e0c0b", fg: "#e9e1d0", accent: "#b3242f", light: 0, cloth: 0, cam: FRONT, look: AT, key: [2.6, 3.6, 3.4], wind: [0.25, 0, -0.9], gust: 0.9 },
  { id: "ala", bg: "#0e0c0b", fg: "#e9e1d0", accent: "#b3242f", light: 0, cloth: 0, cam: [1.7, 2.75, 4.5], look: [-0.55, 1.45, 0], key: [3.0, 3.6, 2.4], wind: [0.3, 2.2, 0.2], gust: 1 },
  { id: "alaari", bg: "#efb21e", fg: "#1c0d08", accent: "#8a1220", light: 1, cloth: 1, cam: FRONT, look: AT, key: [-2.4, 3.8, 3.6], wind: [1.05, 0, -0.5], gust: 1 },
  { id: "adire", bg: "#c6d52a", fg: "#0f1b45", accent: "#1b2f7a", light: 1, cloth: 2, cam: FRONT, look: AT, key: [2.6, 3.8, 3.4], wind: [-1.05, 0, -0.5], gust: 1 },
  { id: "sanyan", bg: "#2236b4", fg: "#f4ead4", accent: "#efb21e", light: 1, cloth: 3, cam: FRONT, look: AT, key: [-2.4, 3.8, 3.6], wind: [1.05, 0, -0.5], gust: 1 },
  { id: "tuntun", bg: "#e7ddc8", fg: "#15110e", accent: "#8a1220", light: 1, cloth: 1, cam: FRONT, look: AT, key: [2.4, 3.8, 3.6], wind: [0.85, 0, -0.5], gust: 1 },
  { id: "weave", bg: "#2c070d", fg: "#f3ead6", accent: "#e0b55a", light: 1, cloth: 1, cam: [0.42, 1.33, 1.55], look: [-0.38, 1.22, 0.78], key: [3.4, 1.9, 1.5], wind: [0, 0, 0], gust: 0 },
  { id: "yours", bg: "#0e0c0b", fg: "#e9e1d0", accent: "#b3242f", light: 0, cloth: 0, cam: [0, 1.2, 5.2], look: [-0.85, 1.18, 0.5], key: [2.4, 3.8, 3.6], wind: [0.3, 0, -1.1], gust: 1 },
];

/** The modern cuts: which cloth each one is made in. */
export const PIECES = [
  { name: "The suit", note: "Double-breasted, in àlàárì", cloth: 1 },
  { name: "The corset & mini", note: "Boned àdìrẹ, àlàárì skirt", cloth: 2 },
  { name: "The gown", note: "One shoulder, in sányán", cloth: 3 },
  { name: "The wide trouser", note: "Àdìrẹ, with a sányán top", cloth: 2 },
  { name: "The pieces", note: "Fìlà, coral, a small bag", cloth: 1 },
];
